
//水池

const { ccclass, property } = cc._decorator;

import MapItem from './MapItem'
import { ItemInfo } from '../GameMsg/MapItemMsg';

@ccclass
export default class PondItem extends MapItem {

    _leftUp: boolean = false;
    @property({ displayName: '左上' })
    set LeftUp(val: boolean) {
        this._leftUp = val;
        this._updateItem();
    }
    get LeftUp() { return this._leftUp; };

    _middleUp: boolean = false;
    @property({ displayName: '中上' })
    set MiddleUp(val: boolean) {
        this._middleUp = val;
        this._updateItem();
    }
    get MiddleUp() { return this._middleUp; };

    _rightUp: boolean = false;
    @property({ displayName: '右上' })
    set RightUp(val: boolean) {
        this._rightUp = val;
        this._updateItem();
    }
    get RightUp() { return this._rightUp; };

    _leftMiddle: boolean = false;
    @property({ displayName: '左中' })
    set LeftMiddle(val: boolean) {
        this._leftMiddle = val;
        this._updateItem();
    }
    get LeftMiddle() { return this._leftMiddle; };

    _rightMiddle: boolean = false;
    @property({ displayName: '右中' })
    set RightMiddle(val: boolean) {
        this._rightMiddle = val;
        this._updateItem();
    }
    get RightMiddle() { return this._rightMiddle; };

    _leftDown: boolean = false;
    @property({ displayName: '左下' })
    set LeftDown(val: boolean) {
        this._leftDown = val;
        this._updateItem();
    }
    get LeftDown() { return this._leftDown; };

    _middleDown: boolean = false;
    @property({ displayName: '中下' })
    set MiddleDown(val: boolean) {
        this._middleDown = val;
        this._updateItem();
    }
    get MiddleDown() { return this._middleDown; };

    _rightDown: boolean = false;
    @property({ displayName: '右下' })
    set RightDown(val: boolean) {
        this._rightDown = val;
        this._updateItem();
    }
    get RightDown() { return this._rightDown; };

    @property(cc.Node)
    L_U: cc.Node[] = []; //左上
    @property(cc.Node)
    M_U: cc.Node[] = []; //上中
    @property(cc.Node)
    R_U: cc.Node[] = []; //右上
    @property(cc.Node)
    L_M: cc.Node[] = []; //左中
    @property(cc.Node)
    R_M: cc.Node[] = []; //右中
    @property(cc.Node)
    L_D: cc.Node[] = []; //左下
    @property(cc.Node)
    M_D: cc.Node[] = []; //中下
    @property(cc.Node)
    R_D: cc.Node[] = []; //右下


    initMapItem(itemInfo: ItemInfo, x: number, y: number) {
        this._isCustom = (itemInfo.Custom == 1);
        this._setPosition(x, y);
        if (itemInfo) {
            this.LayerType = itemInfo.layerType;
            this.ItemType = itemInfo.itemType;
            this.ItemID = itemInfo.itemID;
        }
    }

    _updateItem() {
        //先处理中间4个
        this._setShow(this.M_U[this._middleUp ? 1 : 0])
        this._setShow(this.L_M[this._leftMiddle ? 1 : 0])
        this._setShow(this.R_M[this._rightMiddle ? 1 : 0])
        this._setShow(this.M_D[this._middleDown ? 1 : 0])

        let lu = 0, ru = 0, ld = 0, rd = 0;
        if (this._middleUp) {
            lu = ru = 3;
        }
        if (this._middleDown) {
            ld = rd = 3;
        }

        if (this._leftMiddle) {
            if (lu == 3) lu = 4;
            else lu = 2;
            if (ld == 3) ld = 4;
            else ld = 2;
        }
        if (this._leftUp && lu == 4) {
            lu = 1;
        }
        if (this._leftDown && ld == 4) {
            ld = 1;
        }

        if (this._rightMiddle) {
            if (ru == 3) ru = 4;
            else ru = 2;
            if (rd == 3) rd = 4;
            else rd = 2;
        }
        if (this._rightUp && ru == 4) {
            ru = 1;
        }
        if (this._rightDown && rd == 4) {
            rd = 1;
        }

        this._setShow(this.L_U[lu])
        this._setShow(this.R_U[ru])
        this._setShow(this.L_D[ld])
        this._setShow(this.R_D[rd])
    }
    _setShow(node: cc.Node) {
        for (const iterator of node.parent.children) {
            iterator.active = (iterator == node);
        }
    }
}
