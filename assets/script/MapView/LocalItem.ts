
//临时项目用于移动操作

const { ccclass, property } = cc._decorator;

import MapItem from './MapItem'
@ccclass
export default class MoveItem extends cc.Component {

    @property(cc.Color)
    onColor: cc.Color = null;
    @property(cc.Color)
    offColor: cc.Color = null;
    @property(MapItem)
    MapItem: MapItem = null;

    _canbuild :boolean = false;
    @property
    set CanBuild(val: boolean) {
        this.node.color = val ? this.onColor : this.offColor;
        this._canbuild = val;
    }
    get CanBuild() {
        return this._canbuild;
    }

    copyItem(item:MapItem){
        this.MapItem.ItemPos = item.ItemPos;
        this.MapItem.ItemARPos = item.ItemARPos;
        this.MapItem.sprite.spriteFrame = item.sprite.spriteFrame;
        this.MapItem.sprite.node.color = item.sprite.node.color;
    }

    setPosition(pos:cc.Vec2){
        this.node.setPosition(pos);
    }
}
