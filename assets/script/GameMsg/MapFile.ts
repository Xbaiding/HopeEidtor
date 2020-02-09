
//地图文件

const FILE_NAME = 'FileList';


const getMapFullPath = function (name: string) {
    return jsb.fileUtils.getWritablePath() + 'Map/' + name + '.bmap';
}

enum HasFlag {
    BG = 1 << 4,
    ITEM1 = 1 << 5,
    ITEM2 = 1 << 6,
}

class TiledData {
    x: number;          //Int8 1Byte
    y: number;          //Int8 1Byte
    ground: number;     //Int8 1Byte
    itemID: number[];   //Int16X2 4Byte
    constructor() {
        this.x = -1;
        this.y = -1;
        this.ground = -1;
        this.itemID = [0, 0];
    }

    //用一个字节去标记是否有道具和背景
    //高位为标记 低位用于储存背景数值
    get flag() {
        let flag = 0;

        //标记是否有道具1
        if (this.itemID[0] != 0) {
            flag |= HasFlag.ITEM1;
        }

        //标记是否有道具2
        if (this.itemID[1] != 0) {
            flag |= HasFlag.ITEM2;
        }

        //标记是否有背景
        if (this.ground != -1) {
            flag |= HasFlag.BG;
            flag += this.ground; //背景数值
        }
        return flag;
    }
    static getSize() {
        return 7;
    }
}


//地图数据存储读取数据流
export class MapBuffer {
    private major_ver: number = 1;  //大版本
    private minor_ver: number = 4;  //小版本
    private name: string = '';      //名字 
    private width: number = 0;      //宽度
    private height: number = 0;     //高度
    constructor(name: string, width: number, height: number, defGround: number) {
        this.name = name;
        this.width = width;
        this.height = height;
        this.defGround = defGround;
        this.data = [];
    }
    public clear() {
        this.data.length = 0;
    }

    public defGround: number = 0;        //默认地形
    public data: Array<TiledData> = [];  //数据信息

    //返回一个新数据
    public getData(x: number, y: number): TiledData {
        let itemData = new TiledData();
        itemData.x = x;
        itemData.y = y;
        this.data.push(itemData);
        return itemData;
    }

    //保存到文件
    public saveToFile() {
        //计算长度
        let length = 4;                         //版本号
        length += (this.name.length + 1);        //名字长度
        length += 3; //width+height+defGround
        length += (this.data.length * TiledData.getSize());

        let buffer = new Uint8Array(length);
        buffer[0] = this.major_ver;
        buffer[1] = this.minor_ver;

        let pos = 4
        buffer[pos] = this.name.length; ++pos;
        for (var i = 0, j = this.name.length; i < j; ++i) {
            buffer[pos] = this.name.charCodeAt(i); ++pos;
        }
        buffer[pos] = this.width; ++pos;
        buffer[pos] = this.height; ++pos;
        buffer[pos] = this.defGround; ++pos;

        let flag, hight, low;
        for (const itemdata of this.data) {

            flag = itemdata.flag;

            buffer[pos] = flag; ++pos;
            buffer[pos] = itemdata.x; ++pos;
            buffer[pos] = itemdata.y; ++pos;
            if (itemdata.itemID[0] != 0) {
                //存入道具1
                hight = itemdata.itemID[0] >> 8;
                low = itemdata.itemID[0] & 0xff;
                buffer[pos] = hight; ++pos;
                buffer[pos] = low; ++pos;
            }
            if (itemdata.itemID[1] != 0) {
                //存入道具2
                hight = itemdata.itemID[1] >> 8;
                low = itemdata.itemID[1] & 0xff;
                buffer[pos] = hight; ++pos;
                buffer[pos] = low; ++pos;
            }
        }
        buffer = buffer.subarray(0, pos);

        if (cc.sys.isNative) {
            let filePath = getMapFullPath(this.name);
            jsb.fileUtils.writeDataToFile(buffer, filePath);
        } else {
            var dataString = "";
            for (var i = 0; i < buffer.length; i++) {
                dataString += String.fromCharCode(buffer[i]);
            }
            cc.sys.localStorage.setItem(this.name, dataString);
        }
    }

    //从文件读取
    public readFromFile(): boolean {
        let buferr: Uint8Array;
        if (cc.sys.isNative) {
            let filePath = getMapFullPath(this.name);
            if (jsb.fileUtils.isFileExist(filePath)) {
                buferr = jsb.fileUtils.getDataFromFile(filePath);
                if (buferr == null) {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            let str = cc.sys.localStorage.getItem(this.name);
            if (str == null || str == "") {
                return false;
            }
            buferr = new Uint8Array(str.length);
            for (var i = 0, j = str.length; i < j; ++i) {
                buferr[i] = str.charCodeAt(i);
            }
        }

        let pos = 4 + (this.name.length + 1) + 2;
        this.defGround = buferr[pos]; ++pos;
        let flag, x, y, hight, low;
        for (let i = pos; i < buferr.length;) {
            flag = buferr[i]; ++i;
            x = buferr[i]; ++i;
            y = buferr[i]; ++i;
            if (x == null || y == null ) break;
            let itemdata = this.getData(x, y);
            if (flag & HasFlag.BG) {
                //获得背景数值
                itemdata.ground = (flag & 0xf);
            }
            if (flag & HasFlag.ITEM1) {
                hight = buferr[i]; ++i;
                low = buferr[i]; ++i;
                itemdata.itemID[0] = (hight << 8) + low;
            }
            if (flag & HasFlag.ITEM2) {
                hight = buferr[i]; ++i;
                low = buferr[i]; ++i;
                itemdata.itemID[1] = (hight << 8) + low;
            }
        }
        return true;
    }
};


//地图简单信息
export class MapInfo extends Object {
    name: string = '';      //名字
    width: number = 10;     //宽
    height: number = 10;    //高
    constructor(name: string, width: number, height) {
        super();
        this.name = name;
        this.width = width;
        this.height = height;
    }
};

//地图文件管理类
export class MapFile {

    constructor() {
        this.readFileList();
    }

    private _fileListPath = "";
    private _fileList: Array<MapInfo> = [];

    public getFileList() {
        const list = this._fileList;
        return list;
    }

    /* 添加一个文件 */
    public addFile(data: MapInfo) {
        this._fileList.push(data);
        this.saveFileList();
    }

    /* 删除一个文件 */
    public delFile(index: number) {
        if (index < 0 || this._fileList.length <= index) {
            return;
        }
        if (cc.sys.isNative) {
            let filePath = getMapFullPath(this._fileList[index].name);
            if (jsb.fileUtils.isFileExist(filePath)) {
                jsb.fileUtils.removeFile(filePath);
            }
        } else {
            cc.sys.localStorage.removeItem(this._fileList[index].name);
        }
        this._fileList.splice(index, 1);
        this.saveFileList();
    }

    /* 读取文件列表信息 */
    private readFileList() {
        let filedata;
        if (cc.sys.isNative) {
            this._fileListPath = jsb.fileUtils.getWritablePath() + FILE_NAME;
            if (jsb.fileUtils.isFileExist(this._fileListPath)) {
                filedata = jsb.fileUtils.getStringFromFile(this._fileListPath);
            }
        } else {
            filedata = cc.sys.localStorage.getItem(FILE_NAME);
        }

        if (filedata) {
            let files = filedata.split('\r\n');
            for (let index = 0; index < files.length; index++) {
                let data = files[index].split('|');
                let info = new MapInfo(data[0], Number(data[1]), Number(data[2]));
                this._fileList.push(info);
            }
        }
    }

    /* 保存文件列表信息 */
    private saveFileList() {
        let data: string = '';
        for (let index = 0; index < this._fileList.length; index++) {
            const fileInfo = this._fileList[index];
            data += (fileInfo.name + '|' + fileInfo.width + '|' + fileInfo.height)
            if ((index + 1) != this._fileList.length) {
                data += '\r\n';
            }
        }
        if (cc.sys.isNative) {
            jsb.fileUtils.writeStringToFile(data, this._fileListPath);
        } else {
            cc.sys.localStorage.setItem(FILE_NAME, data);
        }
    }

}


