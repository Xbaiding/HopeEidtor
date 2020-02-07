
const { ccclass, property } = cc._decorator;

import BaseComp from '../Framework/BaseComp';
import { ItemInfo, MapItemMsg } from '../GameMsg/MapItemMsg';
import SpriteMsg from '../GameMsg/SpritesMsg';
import * as Config from '../Config';
import EventDef from '../Eventdef';
@ccclass
export default class SeceltItem extends BaseComp {

    @property(cc.Sprite)
    Sprite: cc.Sprite = null;
    @property(cc.Node)
    SeceltMask: cc.Node = null;
    @property(cc.Label)
    TextName: cc.Label = null;
    @property(cc.Node)
    AddNode: cc.Node = null;
    @property(cc.Node)
    AlterBtn: cc.Node = null;

    _itemIndex: number = -1;    //列表索引
    _itemType: number = -1;
    _mapItemId: number = -1;    //唯一ID

    _initItem(itemIndex:number, itemType: number, itemId: number, showAlter: boolean) {
        this._itemIndex = itemIndex;
        this._itemType = itemType;
        this._mapItemId = itemId;

        if (this.AddNode) {
            this.AddNode.active = (itemId < 0);
        }
        if (this.AlterBtn) {
            this.AlterBtn.active = showAlter;
        }
        if (itemId > 0 || itemType == Config.ItemType.Biome) {
            this._loadSprile(itemId, showAlter);
        }
    }

    @property()
    set Name(val: string) {
        if (this.TextName != null) {
            this.TextName.string = val;
        }
    }
    get Name() {
        if (this.TextName == null) {
            return '';
        }
        return this.TextName.string;
    }
    @property()
    set IsSecelt(val: boolean) {
        if (this.SeceltMask != null) {
            this.SeceltMask.active = val;
        }
    }
    get IsSecelt() {
        if (this.SeceltMask == null) {
            return false;
        }
        return this.SeceltMask.active;
    }

    onSeceltItem() {
        this._pushEvent(EventDef.EVENT_SELECT_ITEM, this._itemIndex);
    }
    onAlterItem() {
        let iteminfo = MapItemMsg.getInstance().getItemWithTypeByIndx(this._itemType, this._itemIndex);
        if (iteminfo) {
            this._pushEvent(EventDef.EVENT_SHOW_CUSTOM, {
                ItemType: iteminfo.itemType,
                ItemID: iteminfo.itemID,
                ItemName: iteminfo.name,
                DiffX: iteminfo.x,
                DiffY: iteminfo.y
            });
        }
    }

    _loadSprile(itemID: number, custom: boolean) {
        if (custom) {
            let filePath = jsb.fileUtils.getWritablePath() + 'Custom/' + itemID + '.png';
            cc.loader.load({ url: filePath, type: 'image' }, this._onComplete.bind(this));
        } else {
            if (this._itemType == Config.ItemType.Biome) {
                this.Sprite.spriteFrame = SpriteMsg.getInstance().getBiomeSpriteFrame(itemID,1);
            }else{
                this.Sprite.spriteFrame = SpriteMsg.getInstance().getMapSpriteFrame(String(itemID));
            }
            if (this.Sprite.spriteFrame) {
                this._updateSize();
            }
        }
    }
    _onComplete(err, res) {
        if (err) return;
        let spriteFrame = new cc.SpriteFrame(res);
        this.Sprite.spriteFrame = spriteFrame;
        this._updateSize();
    }
    _updateSize(){
        let rect = this.Sprite.spriteFrame.getRect()
        let width = rect.width;
        let hight = rect.height;

        if (hight > 200) {
            let scale = 200 / hight;
            width = width * scale;
            this.Sprite.node.setScale(scale);
        }
        if (width > 100) {
            this.node.setContentSize(width + 20, 250);
        }
    }
}
