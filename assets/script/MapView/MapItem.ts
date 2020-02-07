
//地图物品块

const { ccclass, property } = cc._decorator;

import * as Config from '../Config'
import { ItemInfo, MapItemMsg } from '../GameMsg/MapItemMsg';
import SpriteMsg from '../GameMsg/SpritesMsg'

@ccclass
export default class MapItem extends cc.Component {
    @property(cc.Sprite)
    sprite: cc.Sprite = null;   //贴图精灵

    @property()
    set ItemScale(val: number) {
        if (this.sprite) {
            this.sprite.node.setScale(val);
        }
    }
    get ItemScale() {
        if (this.sprite) {
            return this.sprite.node.scale;
        }
        return 0;
    };
    @property()
    set ItemPos(val: cc.Vec2) {
        if (this.sprite) {
            this.sprite.node.setPosition(val);
        }
    }
    get ItemPos() {
        if (this.sprite) {
            return this.sprite.node.position;
        }
        return null;
    };
    @property()
    set ItemARPos(val: cc.Vec2) {
        if (this.sprite) {
            this.sprite.node.setAnchorPoint(val);
        }
    }
    get ItemARPos() {
        if (this.sprite) {
            return this.sprite.node.getAnchorPoint();
        }
        return null;
    };

    /**所属层 */
    LayerType: Config.LayerType = Config.LayerType.Back;
    /**物品类型 */
    ItemType: number = -1;
    /**物品唯一ID */
    ItemID: number = -1;

    _itemIndex: number = -1;
    _isCustom: boolean = false
    _x: number = 0;
    _y: number = 0;

    initMapItem(itemInfo: ItemInfo, x: number, y: number) {
        this._isCustom = (itemInfo.Custom == 1);
        this._setPosition(x,y);
        if (itemInfo) {
            this.LayerType  = itemInfo.layerType;
            this.ItemType   = itemInfo.itemType;
            this.ItemID     = itemInfo.itemID;
            this.ItemScale  = itemInfo.scale;
            this.ItemPos    = cc.v2(itemInfo.x, itemInfo.y);
            this.ItemARPos  = cc.v2(0.5, itemInfo.arY);
            this._loadSprile(this.ItemID, itemInfo.Custom == 1)
            if(itemInfo.hasOwnProperty("color")){
                let c = itemInfo["color"];
                this.sprite.node.color = new cc.Color(c[0],c[1],c[2]);
            }
        }
    }

    /**
     * 设置物品坐标
     * @param x 
     * @param y 
     */
    _setPosition(x:number,y:number){
        //转换成实际坐标
        this._x = x;
        this._y = y;
        this.node.zIndex = x + y * 100;
        this.node.setPosition(cc.v2(x * 100 + 50, - (y * 100) - 50));
    }

    _loadSprile(itemID: number, custom: boolean) {
        let sp = SpriteMsg.getInstance().getMapSpriteFrame(String(itemID),custom);
        if (sp == null) {
            let filePath = jsb.fileUtils.getWritablePath() + 'Custom/' + itemID + '.png';
            cc.loader.load({ url: filePath, type: 'image' }, this._onComplete.bind(this));
        } else {
            this.sprite.spriteFrame = sp;
        }
    }
    
    _onComplete(err, res) {
        if (err)return;
        let spriteFrame = new cc.SpriteFrame(res);
        SpriteMsg.getInstance().addMapSpriteFrame(String(this.ItemID),spriteFrame);
        this.sprite.spriteFrame = spriteFrame;
        cc.dynamicAtlasManager.insertSpriteFrame(spriteFrame);
    }
}
