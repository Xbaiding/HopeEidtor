
const { ccclass, property } = cc._decorator;

import SceneMsg from '../GameMsg/SceneMsg'
import BaseComp from "../Framework/BaseComp";
import Shake from '../Extend/Action/Shake';
import FileItem from './FileItem';
import { MapInfo, MapFile } from '../GameMsg/MapFile';
import EventDef from '../EventDef'


@ccclass
export default class SatrtView extends BaseComp {

    @property(cc.EditBox)
    NameEidtBox: cc.EditBox = null;
    @property(cc.Slider)
    WidthSlider: cc.Slider = null;
    @property(cc.Slider)
    HightSlider: cc.Slider = null;
    @property(cc.EditBox)
    WidthEidtBox: cc.EditBox = null;
    @property(cc.EditBox)
    HightEidtBox: cc.EditBox = null;

    @property(cc.Node)
    PanleList: cc.Node[] = [];
    _showPanleIdx: number = 0;

    @property(cc.Node)
    ListContent: cc.Node = null;
    @property(cc.Prefab)
    ItemPrefab: cc.Prefab = null;

    @property
    MinZise: number = 10;
    @property
    MaxZise: number = 100;

    _fileItem: Array<FileItem> = [];
    _secletIndex: number = -1;

    widthCount: number = 20;
    hightCount: number = 20;

    _mapFile: MapFile = null
    _initView() {
        if (this.WidthSlider != null) {
            this.WidthSlider.progress = 0.2;
        }
        if (this.HightSlider != null) {
            this.HightSlider.progress = 0.2;
        }
        if (this.WidthEidtBox != null) {
            this.WidthEidtBox.string = '20';
        }
        if (this.HightEidtBox != null) {
            this.HightEidtBox.string = '20';
        }
        this.NameEidtBox.string = '';
    }
    onLoad() {
        this._mapFile = new MapFile();
        this._register(EventDef.EVENT_DELFILE_CONFIRM,  this._confirmDelFile );
        this._initView();
    }
    onDestroy(){
        this._destroy(EventDef.EVENT_DELFILE_CONFIRM,   this._confirmDelFile );
    }

    start() {
        this._updateList()
        let node = this.node.parent;
        node.opacity = 0;
        node.runAction(cc.fadeIn(0.5));
    }

    onSlider(target: cc.Slider, type: string) {
        if (target.progress * this.MaxZise < this.MinZise) {
            target.progress = this.MinZise / this.MaxZise;
        }
        let count = Math.floor(target.progress * this.MaxZise);
        this._updateSize(type, target.progress, count);
    }

    onEidtBox(target: cc.EditBox, type: string) {
        let count = Number(target.string);
        if (count == null) {
            return;
        }
        if (count < this.MinZise) { count = this.MinZise; }
        if (count > this.MaxZise) { count = this.MaxZise; }
        target.string = String(count);
        let progress = count / this.MaxZise;
        this._updateSize(type, progress, count);
    }

    _updateSize(type: string, progress: number, count: number) {
        if (type == 'width') {
            this.widthCount = count;
            this.WidthSlider.progress = progress;
            this.WidthEidtBox.string = String(count);
        } else if (type == 'hight') {
            this.hightCount = count;
            this.HightSlider.progress = progress;
            this.HightEidtBox.string = String(count);
        }
    }

    _checkIsHave(name: string): boolean {
        const filelist = this._mapFile.getFileList();
        for (const iterator of filelist) {
            if (iterator.name == name) {
                return true;
            }
        }
        return false;
    }
    onStartButton() {
        if (this._showPanleIdx == 0) {
            let name = this.NameEidtBox.string;
            if (cc.sys.isNative && ((name == '') || this._checkIsHave(name))) {
                this.NameEidtBox.node.runAction(Shake.create(0.2, 15, 15))
                return;
            }
            var strrep = name.replace(/((ht|f)tps?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?/g, '');
            let mapInfo = new MapInfo(strrep, this.widthCount, this.hightCount)
            this._mapFile.addFile(mapInfo);
            SceneMsg.mapName = mapInfo.name;
            SceneMsg.mapSize = new cc.Size(this.widthCount, this.hightCount);
            SceneMsg.startEditor();
        } else {
            const filelist = this._mapFile.getFileList();
            //cc.director.loadScene
            if (filelist.length > 0) {
                let mapInfo = filelist[this._secletIndex];
                SceneMsg.mapName = mapInfo.name;
                SceneMsg.mapSize = new cc.Size(this.widthCount, this.hightCount);
                SceneMsg.startEditor();
            } else {
                this.onChangPanle(null, '0');
                return;
            }
        }
        
    }

    onChangPanle(target: cc.Toggle, data: string) {
        let panleIdx = Number(data);
        this._showPanleIdx = panleIdx;
        for (let index = 0; index < this.PanleList.length; index++) {
            if (this.PanleList != null) {
                this.PanleList[index].active = (index == panleIdx);
            }
        }
    }

    _onOpen(){
        cc.sys.openURL("https://baiding_x.gitee.io/hopeeditor");
    }

    _seceltItem(itemIndex: number) {
        this._secletIndex = itemIndex;
        for (const item of this._fileItem) {
            item.Secelt = (item._itemIndex == itemIndex);
        }
    }

    _updateList() {
        if (this.ListContent != null) {
            this.ListContent.destroyAllChildren();
            this._fileItem = [];
        }

        const filelist = this._mapFile.getFileList();
        for (let index = 0; index < filelist.length; index++) {
            const fileInfo = filelist[index];
            if (this.ItemPrefab != null) {
                let item = cc.instantiate(this.ItemPrefab);
                let fileItem = item.getComponent(FileItem);
                if (fileItem != null) {
                    fileItem.NameLabel.string = fileInfo.name;
                    fileItem.WidthLabel.string = String(fileInfo.width);
                    fileItem.HightLabel.string = String(fileInfo.height);
                    fileItem._setItemIndex(index);
                    fileItem._seceltCallBack = this._seceltItem.bind(this);
                    this._fileItem.push(fileItem);
                }
                this.ListContent.addChild(item);
            }
        }
        this._seceltItem(0);
    }

    onDelFile() {
        this._pushEvent(EventDef.EVENT_SHOW_PROMPT, { info: '是否确认删除?', event: EventDef.EVENT_DELFILE_CONFIRM });
    }

    _confirmDelFile(val: string) {
        if (val == 'Confirm') {
            this._mapFile.delFile(this._secletIndex);
            this._updateList();
        }
    }

    _onNewMap(val: string) {
        if (val == 'Confirm') {
            this.node.active = true;
            this._initView();
            this._updateList();
        }
    }
}
