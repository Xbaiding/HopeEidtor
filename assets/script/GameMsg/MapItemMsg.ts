
//地图物品信息管理器

const { ccclass, property } = cc._decorator;

import * as Config from '../Config'


const CUSTOM_PATH = 'Custom/';
const CUSTOM_FULLPATH = CUSTOM_PATH + 'Custom.json';

//物品信息数据结构
export class ItemInfo extends Object {
    index: number;      //表索引
    itemType: Config.ItemType;   //类型
    itemID: number;     //唯一ID
    layerType: Config.LayerType;  //层别
    removeBack: number; //是否移除地板
    x: number;          //x修正
    y: number;          //y修正
    arY: number;        //y轴锚点
    scale: number;      //缩放系数
    name: string;       //名称
    Custom: number;     //是否为自定义
}

//物品映射信息
export class ItemIndex {
    index: number;          //数据位置索引
    Custom: boolean;        //是否为自定义
}

@ccclass
export class MapItemMsg extends cc.Component {
    private static _instance: MapItemMsg;
    public static getInstance(): MapItemMsg {
        if (this._instance == null) {
            this._instance = new MapItemMsg();
        }
        return this._instance;
    }
    private constructor() {
        super();
    }

    __preload() {
        if (MapItemMsg._instance == null) {
            MapItemMsg._instance = this;
        }
        if (cc.sys.isNative) {
            if (CC_DEBUG && this.WritablePath != '') {
                jsb.fileUtils.setWritablePath(this.WritablePath);
            }
            let writpath = jsb.fileUtils.getWritablePath();
            //创建自定义目录
            let customPath = writpath + CUSTOM_PATH;
            if (!jsb.fileUtils.isDirectoryExist(customPath)) {
                jsb.fileUtils.createDirectory(customPath);
            }
            //创建地图存储目录
            let mapPath = writpath + 'Map/';
            if (!jsb.fileUtils.isDirectoryExist(mapPath)) {
                jsb.fileUtils.createDirectory(mapPath);
            }
        }
    }

    @property(cc.JsonAsset)
    ItemData: cc.JsonAsset = null;  //物品数据
    @property({displayName:'测试目录'})
    WritablePath: string = '';

    _customData: Array<ItemInfo> = [];        //自定物品数组
    _itemIndex: Array<Array<ItemIndex>> = []; //内置物品索引映射

    onLoad() {
        this._initItemInfo();
        this.readCustomData();
    }
    
    //初始化索引映射信息
    _initItemInfo() {
        this._itemIndex = [];
        if (this.ItemData != null) {
            for (let index = 0; index < this.ItemData.json.length; index++) {
                if (this.ItemData.json[index].itemType != -1) {
                    //按类型存入 _itemIndex
                    if (this._itemIndex[this.ItemData.json[index].itemType] == null) {
                        this._itemIndex[this.ItemData.json[index].itemType] = [];
                    }
                    this._itemIndex[this.ItemData.json[index].itemType].push({ index: index, Custom: false });
                }
            }
        }
    }

    /**
     * 通过id查找物品
     * @param itemId 
     */
    public getItemByItemId(itemId: number): ItemInfo {
        for (const iter of this.ItemData.json) {
            if (iter.itemID == itemId) {
                return iter;
            }
        }
        //没有找到从自定义物品查找
        return this.getCustomItemById(itemId);
    }

    /**
     * 通过索引查找物品
     * @param idx 
     */
    public getItemByIndex(idx: number): ItemInfo {
        if (0 <= idx && idx < this.ItemData.json.length) {
            return this.ItemData.json[idx];
        }
        return null;
    }

    /**
     * 获取该种类物品数量
     * @param type 
     */
    public getItemTypeCount(type: number): number {
        if (type == Config.ItemType.Biome) {
            return 7;
        }
        if (this._itemIndex[type] == null) {
            return 0;
        }
        return this._itemIndex[type].length;
    }

    /**
     * 通过类型及索引查找物品
     * @param type 
     * @param idx 
     */
    public getItemWithTypeByIndx(type: number, idx: number): ItemInfo {
        if (this._itemIndex[type] == null || this._itemIndex[type][idx] == null) {
            return null;
        }
        let itemIdx = this._itemIndex[type][idx]
        if (itemIdx.Custom) {
            return this.getCustomItemByIndex(itemIdx.index)
        } else {
            return this.getItemByIndex(itemIdx.index)
        }
    }

    /**
     * 修改自定义物品数据
     * @param info 
     */
    public alterCutomItem(info: ItemInfo) {
        for (let index = 0; index < this._customData.length; index++) {
            if (this._customData[index].itemID == info.itemID) {
                if (info.index == -1) {
                    this._customData.splice(index, 1);
                } else {
                    this._customData[index] = info;
                }
                break;
            }
        }
        this._initItemInfo();
        for (let index = 0; index < this._customData.length; index++) {
            let item = this._customData[index];
            this._itemIndex[item.itemType].push({ index: index, Custom: true });
        }
        this.saveCustomData();
    }

    /**
     * 添加自定义物品数据
     * @param info 
     */
    public addCustomItem(info: ItemInfo) {
        this._itemIndex[info.itemType].push({ index: this._customData.length, Custom: true });
        this._customData.push(info);
    }

    /**
     * 通过索引查找自定义物品
     * @param idx 
     */
    public getCustomItemByIndex(idx: number): ItemInfo {
        if (0 <= idx && idx < this._customData.length) {
            return this._customData[idx];
        }
        return null;
    }

    /**
     * 通过ID查找自定义物品
     * @param id 
     */
    public getCustomItemById(id: number): ItemInfo {
        for (const iter of this._customData) {
            if (iter.itemID == id) {
                return iter;
            }
        }
        return null;
    }

    /**
     * 通过索引查找物品
     * @param indexId 
     */
    public getItemByIndexID(indexId: number): ItemInfo {
        for (const iter of this.ItemData.json) {
            if (iter.index == indexId) {
                return iter;
            }
        }

        for (const iter of this._customData) {
            if (iter.index == indexId) {
                return iter;
            }
        }
        return null;
    }

    /**
     * 读取自定义数据
     */
    public readCustomData() {
        if (!cc.sys.isNative) return;
        let filePath = jsb.fileUtils.getWritablePath() + CUSTOM_FULLPATH;
        if (jsb.fileUtils.isFileExist(filePath)) {
            let filedata = jsb.fileUtils.getStringFromFile(filePath);
            let customData = JSON.parse(filedata);
            for (const iter of customData) {
                this.addCustomItem(iter);
            }
        }
    }

    public saveCustomData() {
        let content = JSON.stringify(this._customData);
        let filePath = jsb.fileUtils.getWritablePath() + CUSTOM_FULLPATH;
        jsb.fileUtils.writeStringToFile(content, filePath);
    }

}

