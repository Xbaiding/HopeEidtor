
//自定义物品界面

const { ccclass, property } = cc._decorator;

import EventDef from '../Eventdef';
import BaseView from "../Framework/BaseView";
import { ItemInfo, MapItemMsg } from '../GameMsg/MapItemMsg';

@ccclass
export default class CustomItemView extends BaseView {

    @property(cc.Sprite)
    Sprite: cc.Sprite = null;
    @property(cc.EditBox)
    EditName: cc.EditBox = null;
    @property(cc.EditBox)
    EditItemID: cc.EditBox = null;
    @property(cc.EditBox)
    DiffX: cc.EditBox = null;
    @property(cc.EditBox)
    DiffY: cc.EditBox = null;
    @property(cc.Node)
    AddBtn: cc.Node = null;
    @property(cc.Node)
    AlterBtn: cc.Node = null;
    @property(cc.Node)
    DelBtn: cc.Node = null;

    _ItemType: number = -1;
    _ItemName: string = '';
    _ItemID: number = -1;
    _DiffX: number = 0;
    _DiffY: number = -44;
    _IsAlter: boolean = false;

    onLoad() {
        this._register(EventDef.EVENT_SHOW_CUSTOM,this._onShowView);
        this._register(EventDef.EVENT_DEL_CUSTOM,this._onHideView);
        if (this.Sprite != null) {
            this.Sprite.node.on(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        }
    }
    onDestroy() {
        this._destroy(EventDef.EVENT_SHOW_CUSTOM,this._onShowView);
        this._destroy(EventDef.EVENT_DEL_CUSTOM,this._onHideView);
    }

    _onShowView(data:any){
        this.onShow();
        this._ItemType = data.ItemType;
        if (data.ItemName) {
            this._ItemName = data.ItemName;
        }
        this._ItemID = -1;
        if (data.ItemID) {
            this._ItemID = data.ItemID;
        }
        if (data.DiffX) {
            this._DiffX = data.DiffX;
        }
        if (data.DiffY) {
            this._DiffY = data.DiffY;
        }
        this._updateView();
    }

    _onHideView(data) {
        if (data == 'Confirm') {
            let data: ItemInfo = new ItemInfo;
            data.index = -1;
            data.itemID = this._ItemID;
            this._pushEvent(EventDef.EVENT_ALTER_CUSTOM, data);
            MapItemMsg.getInstance().alterCutomItem(data);
            this.onClose();
        }
    }

    _updateView() {
        this.Sprite.node.active = false;
        this.AddBtn.active = false;
        this._IsAlter = (this._ItemID != -1);
        this.AlterBtn.active = this._IsAlter;
        this.DelBtn.active = this._IsAlter;

        this.EditItemID.string = '';
        if (this._IsAlter) {
            this.EditName.string = this._ItemName;
            this.EditItemID.string = String(this._ItemID);
            this._downloadFile()
            this.EditItemID.node.pauseSystemEvents(false);
        } else {
            this._DiffX = 0;
            this._DiffY = -44;
            this._ItemID = -1;
            this._ItemName = '';
            this.EditName.string = '';
            this.EditItemID.string = '';
            this.EditItemID.node.resumeSystemEvents(false);
        }

        if (this.DiffX) {
            this.DiffX.string = String(this._DiffX);
        }
        if (this.DiffY) {
            this.DiffY.string = String(this._DiffY);
        }
        this.Sprite.node.setPosition(this._DiffX, this._DiffY);
    }


    _onTouchMove(event: cc.Event.EventTouch) {
        let offPos: cc.Vec2 = event.getDelta();
        if (offPos.x == 0 && offPos.y == 0) {
            return;
        }
        let curPos: cc.Vec2 = this.Sprite.node.getPosition();
        curPos = curPos.addSelf(offPos);
        this.Sprite.node.setPosition(curPos);
        this._DiffX = Math.floor(curPos.x);
        this._DiffY = Math.floor(curPos.y);
        if (this.DiffX) {
            this.DiffX.string = String(this._DiffX);
        }
        if (this.DiffY) {
            this.DiffY.string = String(this._DiffY);
        }
    }

    /* 下载文件 */
    _downloadFile() {
        if (this._ItemID == -1) {
            return;
        }
        let picName = this._ItemID + '.png';
        let filePath = jsb.fileUtils.getWritablePath() + 'Custom/';
        if (!jsb.fileUtils.isDirectoryExist(filePath)) {
            jsb.fileUtils.createDirectory(filePath);
        }
        filePath += picName;

        if (jsb.fileUtils.isFileExist(filePath)) {
            this._setSpriteFrame(filePath);
            return;
        }
        let picUrl = 'http://guide.onehouronelife.cn/static/sprites/obj_' + picName;
        var request = cc.loader.getXMLHttpRequest();
        request.open("GET", picUrl, true);
        request.responseType = "arraybuffer";
        request.onload = function () {
            if (request.status == 200) {
                let data = new Uint8Array(request.response)
                if (data[0] == 137) {
                    jsb.fileUtils.writeDataToFile(data, filePath);
                    this._setSpriteFrame(filePath);
                }
            }
        }.bind(this);
        request.send();
    }

    _setSpriteFrame(filePath) {
        cc.loader.load({ url: filePath, type: 'image' }, function (err, res) {
            if (err) {
                cc.log(err)
                return;
            }
            if (this.Sprite) {
                let spriteFrame = new cc.SpriteFrame(res);
                this.Sprite.spriteFrame = spriteFrame;
                this.Sprite.node.active = true;
                this.AddBtn.active = !this._IsAlter;
            }
        }.bind(this));
    }

    onEditor(edit: cc.EditBox, data: string) {
        if (data == 'name') {
            this._ItemName = edit.string;
        } else {
            let num = Number(edit.string);
            if (num == null) {
                return;
            }
            if (data == 'itemId') {
                this._ItemID = num;
                this._downloadFile()
            } else if (data == 'diffX') {
                this._DiffX = num;
                this.Sprite.node.setPosition(this._DiffX, this._DiffY);
            } else if (data == 'diffY') {
                this._DiffY = num;
                this.Sprite.node.setPosition(this._DiffX, this._DiffY);
            }
        }
    }

    openURL() {
        cc.sys.openURL('http://guide.onehouronelife.cn/');
    }
    
    onConfirmBtn() {
        let data: ItemInfo = new ItemInfo();
        data.index = this._ItemID;
        data.itemType = this._ItemType;
        data.itemID = this._ItemID;
        data.layerType = 1;
        data.removeBack = 0;
        data.x = this._DiffX;
        data.y = this._DiffY;
        data.arY = 0;
        data.scale = 0.78;
        data.name = this.EditName.string;
        data.Custom = 1;
        if (this._IsAlter) {
            MapItemMsg.getInstance().alterCutomItem(data);
        } else {
            MapItemMsg.getInstance().addCustomItem(data);
        }
        MapItemMsg.getInstance().saveCustomData();
        this._pushEvent(this._IsAlter ? EventDef.EVENT_ALTER_CUSTOM : EventDef.EVENT_ADD_CUSTOM, data);
        this.onHide();
    }
    onDelBtn() {
        this._pushEvent(EventDef.EVENT_SHOW_PROMPT, { info: '是否确认删除?', event: EventDef.EVENT_DEL_CUSTOM });
    }

    onClose() {
        this.node.active = false;
    }
}
