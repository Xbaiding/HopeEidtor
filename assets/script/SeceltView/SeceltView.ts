
//底部物品栏

const { ccclass, property } = cc._decorator;


import BaseComp from '../Framework/BaseComp';
import SeceltItem from './SeceltItem'
import { ItemInfo, MapItemMsg } from '../GameMsg/MapItemMsg';
import * as Config from '../Config'
import EventDef from '../Eventdef';

const BiomeName = [
    '草地',
    '沼泽',
    '黄草原',
    '荒地',
    '冰原',
    '沙漠',
    '雨林'
]
@ccclass
export default class SeceltView extends BaseComp {

    @property(cc.Node)
    ListContent: cc.Node = null;
    @property(cc.Prefab)
    ItemPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    BiomePrefab: cc.Prefab = null;

    _listItems: Array<Array<SeceltItem>> = [];  //item池
    _SeceltType: Config.ItemType = Config.ItemType.Road;
    _CutomItem: cc.Node = null;

    onLoad() {
        this._register(EventDef.EVENT_SELECT_ITEM,  this._SelectItem );
        this._register(EventDef.EVENT_ADD_CUSTOM,   this._updateList );
        this._register(EventDef.EVENT_ALTER_CUSTOM, this._updateItem );
    }
    onDestroy(){
        this._destroy(EventDef.EVENT_SELECT_ITEM,  this._SelectItem );
        this._destroy(EventDef.EVENT_ADD_CUSTOM,   this._updateList );
        this._destroy(EventDef.EVENT_ALTER_CUSTOM, this._updateItem );
    }
    
    start(){
        this._updateList();
    }

    _SelectItem(itemIndex: any) {
        if (this._listItems[this._SeceltType] == null) {
            return;
        }
        if (Config.CUSTOM_INDEX == itemIndex) {
            this._pushEvent(EventDef.EVENT_SHOW_CUSTOM, { ItemType: this._SeceltType });
            return;
        }
        for (const item of this._listItems[this._SeceltType]) {
            item.IsSecelt = (item._itemIndex == itemIndex);
        }
    }

    _updateItem(info: ItemInfo) {
        for (const item of this._listItems[this._SeceltType]) {
            if (item._mapItemId == info.itemID) {
                if (info.index == -1) {
                    item.destroy()
                    item.node.removeFromParent();
                    this._listItems[this._SeceltType].splice(item._itemIndex, 1);
                } else {
                    item.Name = info.name;
                }
                break;
            }
        }
    }

    //刷新列表
    _updateList() {
        if (this.ListContent == null || this.ItemPrefab == null) {
            return;
        }
        this.ListContent.removeAllChildren(false);
        let count = MapItemMsg.getInstance().getItemTypeCount(this._SeceltType);
        for (let index = 0; index < count; index++) {
            let seceltItem = this._getSeceltItem(index);
            if (seceltItem != null) {
                this.ListContent.addChild(seceltItem.node);
            }
        }
        this._addCustomItem();
        let firstItem = this._getSeceltItem(0);
        if (firstItem) {
            this._pushEvent(EventDef.EVENT_SELECT_ITEM, 0)
        }
    }

    _addCustomItem() {
        if (!cc.sys.isNative || this._SeceltType == Config.ItemType.Biome) {
            return;
        }
        if (this._CutomItem == null) {
            let item = cc.instantiate(this.ItemPrefab);
            let seceltItem = item.getComponent(SeceltItem);
            if (seceltItem == null) {
                return;
            }
            this._CutomItem = item;
            seceltItem._initItem(Config.CUSTOM_INDEX, -1, -1, false);
            seceltItem.IsSecelt = false;
        }
        this.ListContent.addChild(this._CutomItem);
    }

    _getSeceltItem(idx: number): SeceltItem {
        if (this._listItems[this._SeceltType] == null) {
            this._listItems[this._SeceltType] = []
        }
        if (this._listItems[this._SeceltType][idx] == null) {
            //池中没有需要创建
            let seceltItem;
            if (this._SeceltType == Config.ItemType.Biome) {
                seceltItem = this._createBiomeItem(idx);
            } else {
                seceltItem = this._createCommonItem(idx);
            }
            if (seceltItem == null) {
                return null;
            }
            seceltItem.IsSecelt = false;
            this._listItems[this._SeceltType][idx] = seceltItem;
        }
        return this._listItems[this._SeceltType][idx];
    }

    _createCommonItem(idx: number): SeceltItem {
        let item = cc.instantiate(this.ItemPrefab);
        let seceltItem = item.getComponent(SeceltItem);
        if (seceltItem == null) {
            return null;
        }
        let itemInfo = MapItemMsg.getInstance().getItemWithTypeByIndx(this._SeceltType, idx);
        if (itemInfo == null) {
            return null;
        }
        seceltItem.Name = itemInfo.name;
        seceltItem._initItem(idx, itemInfo.itemType, itemInfo.itemID, itemInfo.Custom == 1);

        if(itemInfo.hasOwnProperty("color")){
            let c = itemInfo["color"];
            seceltItem.Sprite.node.color = new cc.Color(c[0],c[1],c[2]);
        }

        return seceltItem;
    }

    _createBiomeItem(idx: number): SeceltItem {
        let item = cc.instantiate(this.BiomePrefab);
        let seceltItem = item.getComponent(SeceltItem);
        if (seceltItem == null) {
            return null;
        }
        seceltItem.Name = BiomeName[idx];
        seceltItem._initItem(idx, this._SeceltType, idx, false);
        return seceltItem;
    }

    onSeceltType(target: cc.Toggle, data: string) {
        let seceltType = Number(data);
        if (this._SeceltType == seceltType) {
            return;
        }
        this._SeceltType = seceltType;
        this._updateList();
        this._pushEvent(EventDef.EVENT_SELECT_TYPE, this._SeceltType);
    }
}
