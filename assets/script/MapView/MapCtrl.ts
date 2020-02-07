
//Map控制器

const { ccclass, property } = cc._decorator;

import SceneMsg from '../GameMsg/SceneMsg'
import BaseComp from '../Framework/BaseComp';
import MapItem from './MapItem'
import PondItem from './PondItem'
import * as Config from '../Config'
import { ItemInfo, MapItemMsg } from '../GameMsg/MapItemMsg';
import { RecordType, RecordInfo, MapRecordMsg } from '../GameMsg/MapRecordMsg'
import MapView from './MapView'
import MapGround from './MapGround'
import LocalItem from './LocalItem'
import EventDef from '../Eventdef';
import { MapBuffer } from '../GameMsg/MapFile';


//单个地图块数据
class TiledInfo {
    x: number = -1;
    y: number = -1;
    mapItem: MapItem[] = [null, null];
    ground: number = -1;

    add(layerType: number, item: MapItem) {
        this.mapItem[layerType] = item;
    }
    get(layerType: number): MapItem {
        return this.mapItem[layerType];
    }
    remove(layerType: number) {
        this.mapItem[layerType] = null;
    }

}

//地图数据
class MapItemInfo {
    private data: { [key: number]: TiledInfo } = {};
    public put(key: number, item: TiledInfo) {
        this.data[key] = item;
    }
    public clear() {
        this.data = {};
    }
    public get(x: number, y: number, create: boolean = false): TiledInfo {
        let key = (x << 8) + y;
        if (this.data[key]) {
            return this.data[key]
        } else {
            if (create) {
                let item = new TiledInfo;
                item.x = x;
                item.y = y;
                this.put(key, item);
                return item;
            }
            return null;
        }
    }
    public remove(x: number, y: number) {
        let key = (x << 8) + y;
        if (this.data[key]) {
            delete this.data[key]
        }
    }
    public eachMap(callBack: (item: TiledInfo) => void) {
        for (const key in this.data) {
            if (this.data.hasOwnProperty(key)) {
                callBack(this.data[key])
            }
        }
    }
}

@ccclass
export default class MapCtrl extends BaseComp {

    @property(cc.Prefab)
    MapItem: cc.Prefab = null;
    @property(cc.Prefab)
    PondItem: cc.Prefab = null;

    @property(MapView)
    MapView: MapView = null;           //Map界面
    @property(MapGround)
    MapGround: MapGround = null;       //Map背景
    @property(LocalItem)
    LocalItem: LocalItem = null;

    _fileName: string = '';
    _curItemType: Config.ItemType = Config.ItemType.Road;//当前选择物品类型
    _curItemIndex: number = -1;                          //当前选择物品索引

    _mapItemData: MapItemInfo = null;                   //地图信息

    _defGround: Config.BiomeType = Config.BiomeType.TYPE_0;
    _widthCount: number = 0;
    _highCount: number = 0;

    _curMoveItem: MapItem = null;

    onLoad() {
        this._mapItemData = new MapItemInfo();
        this._register(EventDef.EVENT_SELECT_TYPE,  this._setCurItemType );
        this._register(EventDef.EVENT_SELECT_ITEM,  this._setCurItemIndex );
        this._register(EventDef.EVENT_MOME_ITEM_ON, this._onMoveItem );
        this._register(EventDef.EVENT_MOME_ITEM_END,this._setMoveItem );
        this._register(EventDef.EVENT_SAVE_FILE,    this._saveMapToFile );
        this._register(EventDef.EVENT_ALTER_CUSTOM, this._alterMapLayer );
        this._register(EventDef.EVENT_SELECT_MAPPOS,this._SelectMapPos );
        this._register(EventDef.EVENT_CLICK_OPERATE,this._clickMapOperate );
        this._register(EventDef.EVENT_RECORD_OPERATE,this._doRecordOperate );
        this._register(EventDef.EVENT_SET_DEFGROUND, this._setMapDefGround );
    }
    onDestroy(){
        this._destroy(EventDef.EVENT_SELECT_TYPE,   this._setCurItemType );
        this._destroy(EventDef.EVENT_SELECT_ITEM,   this._setCurItemIndex );
        this._destroy(EventDef.EVENT_MOME_ITEM_ON,  this._onMoveItem );
        this._destroy(EventDef.EVENT_MOME_ITEM_END, this._setMoveItem );
        this._destroy(EventDef.EVENT_SAVE_FILE,     this._saveMapToFile );
        this._destroy(EventDef.EVENT_ALTER_CUSTOM,  this._alterMapLayer );
        this._destroy(EventDef.EVENT_SELECT_MAPPOS, this._SelectMapPos );
        this._destroy(EventDef.EVENT_CLICK_OPERATE, this._clickMapOperate );
        this._destroy(EventDef.EVENT_RECORD_OPERATE,this._doRecordOperate );
        this._destroy(EventDef.EVENT_SET_DEFGROUND, this._setMapDefGround );
    }
    start(){
        let data = {
            name:SceneMsg.mapName,
            width:SceneMsg.mapSize.width,
            height:SceneMsg.mapSize.height,
        }

        this._mapItemData.clear();
        this._fileName = data.name;
        this._widthCount = data.width;
        this._highCount = data.height;
        this._defGround = Config.BiomeType.TYPE_0;

        this.MapView._initMap(data);        //初始化地图
        this.MapGround._initGround(SceneMsg.mapSize);   //初始化背景
        this._readMapForFile();
        MapRecordMsg.getInstance().clearRecord();
    }

    _setCurItemType(data) {
        this._curItemType = data;
    }
    _setCurItemIndex(data) {
        if (data == Config.CUSTOM_INDEX) {
            return;
        }
        this._curItemIndex = data;
    }

    //点击地图操作
    _clickMapOperate(pos) {
        if (this._curItemIndex == -1) {
            this._SelectMapPos(pos);    //删除操作直接处理
            return;
        }

        let item = this._getItem(Config.LayerType.Froe, pos.x, pos.y);
        if (item == null) {
            item = this._getItem(Config.LayerType.Back, pos.x, pos.y)
        }
        if (item != null) {
            item.node.opacity = 125;
            this._curMoveItem = item;
            this.LocalItem.node.active = true;
            this.LocalItem.CanBuild = true;
            this.LocalItem.copyItem(item);
            this.LocalItem.setPosition(item.node.position);
        } else {
            this._SelectMapPos(pos);
        }

    }

    _onMoveItem(pos) {
        let layer = this._curMoveItem.LayerType
        if (this._getItem(layer, pos.x, pos.y)) {
            this.LocalItem.CanBuild = false;
        } else {
            this.LocalItem.CanBuild = true;
        }

        let beforItem = this._getItem(layer, pos.x, pos.y);
        if (beforItem) {
            this.LocalItem.CanBuild = false;
        } else {

            if (layer == Config.LayerType.Back) {
                let foreItem = this._getItem(Config.LayerType.Froe, pos.x, pos.y);
                if (foreItem != null) {
                    let _iteminfo = MapItemMsg.getInstance().getItemByItemId(foreItem.ItemID);
                    if (_iteminfo.removeBack == 1) {
                        this.LocalItem.CanBuild = false;
                    }
                }
            } else {
                let _iteminfo = MapItemMsg.getInstance().getItemByItemId(this._curMoveItem.ItemID);
                if (_iteminfo.removeBack == 1) {
                    let _iteminfo = this._getItem(Config.LayerType.Back, pos.x, pos.y);
                    if (_iteminfo) {
                        this.LocalItem.CanBuild = false;
                    }
                }
            }
        }
    }

    _setMoveItem(pos) {
        if (this._curMoveItem) {
            this._curMoveItem.node.opacity = 255;
        }
        if (pos == null) return;
        this._onMoveItem(pos);
        if (this.LocalItem.CanBuild) {
            let record = new RecordInfo(RecordType.MoveItem, this._curMoveItem.LayerType,
                pos.x, pos.y, this._curMoveItem._x, this._curMoveItem._y
            )
            MapRecordMsg.getInstance().pushRecord(record);
            this._moveMapItem(this._curMoveItem.LayerType,
                pos.x, pos.y, this._curMoveItem._x, this._curMoveItem._y
            )
        }
    }

    //物品移动
    _moveMapItem(layer: number, newX: number, newY: number, oldX: number, oldY: number) {
        let oldItem = this._mapItemData.get(oldX, oldY);
        let newItem = this._mapItemData.get(newX, newY, true);
        newItem.mapItem[layer] = oldItem.mapItem[layer];
        oldItem.mapItem[layer] = null;
        this._curMoveItem._setPosition(newX, newY);
    }

    //处理点击的地图快
    _SelectMapPos(pos: cc.Vec2) {
        if (this._curItemType == Config.ItemType.Biome && this._curItemIndex != -1) {

            let curType = this._getGroundType(pos.x, pos.y);
            if (curType == -1 && this._curItemIndex == this._defGround) {
                return;
            }
            if (curType != this._curItemIndex) {
                this._setMapGround(this._curItemIndex, pos.x, pos.y);
                let record = new RecordInfo(RecordType.SetGround, this._curItemIndex, pos.x, pos.y, curType)
                MapRecordMsg.getInstance().pushRecord(record);
            }
            return;
        }

        if (this._curItemIndex == -1) {
            let delId = -1;
            let foreItem = this._getItem(Config.LayerType.Froe, pos.x, pos.y);
            if (foreItem) {
                delId = foreItem.ItemID;
                this._removeItem(Config.LayerType.Froe, pos.x, pos.y)
            } else {
                let backItem = this._getItem(Config.LayerType.Back, pos.x, pos.y);
                if (backItem) {
                    delId = backItem.ItemID;
                    this._removeItem(Config.LayerType.Back, pos.x, pos.y);
                }
            }

            if (delId != -1) {
                let record = new RecordInfo(RecordType.DelItem, delId, pos.x, pos.y)
                MapRecordMsg.getInstance().pushRecord(record);
            }
            return;
        }

        //生成记录
        let iteminfo = MapItemMsg.getInstance().getItemWithTypeByIndx(this._curItemType, this._curItemIndex);
        let record = new RecordInfo(RecordType.AddItem, iteminfo.itemID, pos.x, pos.y)
        //新添加时需要移除旧的物品
        if (this._removeOldItem(iteminfo, pos, record)) {
            return;
        }
        this._addMapItem(iteminfo, pos.x, pos.y);
        let item = this._getItem(iteminfo.layerType, pos.x, pos.y);
        this.MapView._playAddAction(item.node);
        MapRecordMsg.getInstance().pushRecord(record);
    }

    //设置默认地形
    _setMapDefGround(type: Config.BiomeType) {
        this._defGround = type;
        for (let y = 0; y < this._highCount; y++) {
            for (let x = 0; x < this._widthCount; x++) {
                let curType = this._getGroundType(x, y);
                if (curType == -1) {
                    this.MapGround._onSetGround(this._defGround, x, y);
                }
            }
        }
    }

    //获取该坐标地形类别
    _getGroundType(x: number, y: number): number {
        let itemData = this._mapItemData.get(x, y);
        if (itemData == null) {
            return Config.BiomeType.DEF;
        }
        return itemData.ground;
    }

    //设置对应坐标地形
    _setMapGround(type: Config.BiomeType, x: number, y: number) {
        let itemData = this._mapItemData.get(x, y, true);
        itemData.ground = type;
        if (type == Config.BiomeType.DEF) {
            this.MapGround._onSetGround(this._defGround, x, y);
        } else {

            this.MapGround._onSetGround(type, x, y);
        }
    }

    // 在地图上添加物品
    _addMapItem(iteminfo: ItemInfo, x: number, y: number) {
        if (iteminfo == null) return;
        let item: cc.Node;
        if (iteminfo.itemID == Config.PondId) {
            item = cc.instantiate(this.PondItem);
        } else {
            item = cc.instantiate(this.MapItem);
        }

        if (item == null) {
            return null;
        }
        let mapItem = item.getComponent(MapItem);
        if (mapItem != null) {
            mapItem.initMapItem(iteminfo, x, y);
            let itemData = this._mapItemData.get(x, y, true);
            itemData.add(iteminfo.layerType, mapItem);
            this.MapView._addMapItem(iteminfo.layerType, item);
            if (iteminfo.itemID == Config.PondId) {
                this._updatePond(mapItem.node, true);
            }
        }
    }

    //更新水池
    _updatePond(item: cc.Node, add: boolean) {
        let pond = item.getComponent(PondItem);
        if (pond == null) return;
        if (this._updateNearPond(pond._x - 1, pond._y - 1, 'RightDown', add))
            pond._leftUp = true;
        if (this._updateNearPond(pond._x, pond._y - 1, 'MiddleDown', add))
            pond._middleUp = true;
        if (this._updateNearPond(pond._x + 1, pond._y - 1, 'LeftDown', add))
            pond._rightUp = true;
        if (this._updateNearPond(pond._x - 1, pond._y, 'RightMiddle', add))
            pond._leftMiddle = true;
        if (this._updateNearPond(pond._x + 1, pond._y, 'LeftMiddle', add))
            pond._rightMiddle = true;
        if (this._updateNearPond(pond._x - 1, pond._y + 1, 'RightUp', add))
            pond._leftDown = true;
        if (this._updateNearPond(pond._x, pond._y + 1, 'MiddleUp', add))
            pond._middleDown = true;
        if (this._updateNearPond(pond._x + 1, pond._y + 1, 'LeftUp', add))
            pond._rightDown = true;
        if (add) {
            pond._updateItem();
        }
    }

    //更新附近水池
    _updateNearPond(x, y, key, add) {
        let lu = this._getItem(Config.LayerType.Back, x, y);
        if (lu == null) return false;
        if (lu.ItemID == Config.PondId) {
            let _pond = lu.node.getComponent(PondItem);
            if (_pond) _pond[key] = add;
            return true;
        }
        return false;
    }

    //获取该坐标物品
    _getItem(layerType: Config.LayerType, x: number, y: number): MapItem {
        let itemData = this._mapItemData.get(x, y);
        if (itemData) {
            return itemData.get(layerType);
        }
        return null;
    }

    //移除物品
    _removeItem(layerType: number, x: number, y: number) {
        let item = this._getItem(layerType, x, y);
        if (item != null) {
            if (item.ItemID == Config.PondId) {
                this._updatePond(item.node, false);
            }
            item.node.destroy();
            let itemData = this._mapItemData.get(x, y);
            itemData.remove(layerType);
            return true;
        }
        return false;
    }

    //移除旧的物品
    _removeOldItem(iteminfo: ItemInfo, pos: cc.Vec2, record: RecordInfo): boolean {
        let beforItem = this._getItem(iteminfo.layerType, pos.x, pos.y);
        if (beforItem != null) {
            //相同物品无需添加
            if (iteminfo.itemID == beforItem.ItemID) {
                return true;
            }

            if (this._removeItem(beforItem.LayerType, pos.x, pos.y)) {
                //移除成功需要记录
                record.val1 = beforItem.ItemID;
            }

        }

        //之前物品为空但需要移除互斥物品
        if (beforItem == null) {
            if (iteminfo.layerType == Config.LayerType.Back) {
                let foreItem = this._getItem(Config.LayerType.Froe, pos.x, pos.y);
                if (foreItem != null) {
                    let _iteminfo = MapItemMsg.getInstance().getItemByItemId(foreItem.ItemID);
                    if (_iteminfo.removeBack == 1) {
                        let id = _iteminfo.itemID;
                        if (this._removeItem(Config.LayerType.Froe, pos.x, pos.y)) {
                            record.val1 = id;
                        }
                    }
                }
            } else {
                if (iteminfo.removeBack == 1) {
                    let _iteminfo = this._getItem(Config.LayerType.Back, pos.x, pos.y);
                    if (_iteminfo) {
                        let id = _iteminfo.ItemID;
                        if (this._removeItem(Config.LayerType.Back, pos.x, pos.y)) {
                            record.val1 = id;
                        }
                    }
                }
            }
        }
        return false;
    }

    //修改自定义道具对已经添加在地图上的进行处理
    _alterMapItem(layer: Config.LayerType, info: ItemInfo): boolean {
        let alter = false;
        this._mapItemData.eachMap(
            function (mapItemData) {
                let item = mapItemData.mapItem[layer];
                if (item && item._isCustom && item.ItemID == info.itemID) {
                    if (info.index == -1) {
                        alter = true;
                        item.node.removeFromParent();
                        item.destroy()
                        mapItemData.mapItem[layer] = null;
                    } else {
                        item.ItemPos = cc.v2(info.x, info.y);
                    }
                }
            }
        )
        return alter;
    }
    _alterMapLayer(info: ItemInfo) {
        if (this._alterMapItem(Config.LayerType.Back, info) ||
            this._alterMapItem(Config.LayerType.Froe, info)) {
            if (info.index == -1)
                this._saveMapToFile();
        }
    }

    //恢复与重做操作
    _doRecordOperate(type: string) {
        if (type == 'UnDo') {
            let info = MapRecordMsg.getInstance().getUnDo();
            if (info == null) return;
            switch (info.type) {
                case RecordType.AddItem: {
                    let iteminfo = MapItemMsg.getInstance().getItemByItemId(info.id);
                    if (iteminfo == null) return;
                    this._removeItem(iteminfo.layerType, info.x, info.y);
                    if (info.val1 != -1) {
                        let item1 = MapItemMsg.getInstance().getItemByItemId(info.val1);
                        this._addMapItem(item1, info.x, info.y);
                    }
                    if (info.val2 != -1) {
                        let item2 = MapItemMsg.getInstance().getItemByItemId(info.val2);
                        this._addMapItem(item2, info.x, info.y);
                    }
                    break;
                } case RecordType.DelItem: {
                    let iteminfo = MapItemMsg.getInstance().getItemByItemId(info.id);
                    this._addMapItem(iteminfo, info.x, info.y);
                    break;
                } case RecordType.MoveItem: {
                    this._moveMapItem(info.id, info.val1, info.val2, info.x, info.y);
                    break;
                } case RecordType.SetGround: {
                    this._setMapGround(info.val1, info.x, info.y);
                    break;
                } default:
                    break;
            }
        } else {
            let info = MapRecordMsg.getInstance().getReDo();
            if (info == null) return;
            switch (info.type) {
                case RecordType.AddItem: {
                    let iteminfo = MapItemMsg.getInstance().getItemByItemId(info.id);
                    if (iteminfo == null) return;
                    this._addMapItem(iteminfo, info.x, info.y);
                    if (info.val1 != -1) {
                        let item1 = MapItemMsg.getInstance().getItemByItemId(info.val1);
                        if (item1 == null)
                            this._removeItem(item1.layerType, info.x, info.y);
                    }
                    if (info.val2 != -1) {
                        let item2 = MapItemMsg.getInstance().getItemByItemId(info.val2);
                        if (item2 == null)
                            this._removeItem(item2.layerType, info.x, info.y);
                    }
                    break;
                } case RecordType.DelItem: {
                    let iteminfo = MapItemMsg.getInstance().getItemByItemId(info.id);
                    if (iteminfo)
                        this._removeItem(iteminfo.layerType, info.x, info.y);
                    break;
                } case RecordType.MoveItem: {
                    this._moveMapItem(info.id, info.x, info.y, info.val1, info.val2);
                    break;
                } case RecordType.SetGround: {
                    this._setMapGround(info.id, info.x, info.y);
                    break;
                } default:
                    break;
            }
        }
    }

    _setTiledInfo = function (tiledData) {
        let x = tiledData.x;
        let y = tiledData.y;
        for (const itemID of tiledData.itemID) {
            if (itemID != 0) {
                let iteminfo = MapItemMsg.getInstance().getItemByItemId(itemID);
                if (iteminfo) {
                    this._getItem(iteminfo.layerType, x, y);
                    this._addMapItem(iteminfo, x, y);
                }
            }
        }
        if (tiledData.ground != -1) {
            this._setMapGround(tiledData.ground, x, y);
        }
    }

    //读取地图文件
    _readMapForFile() {
        let mapData = new MapBuffer(this._fileName, this._widthCount, this._highCount, this._defGround);
        if (mapData.readFromFile()) {
            let x, y
            for (const tiledData of mapData.data) {
                x = tiledData.x; y = tiledData.y;
                for (const itemID of tiledData.itemID) {
                    if (itemID != 0) {
                        let iteminfo = MapItemMsg.getInstance().getItemByItemId(itemID);
                        if (iteminfo) {
                            this._getItem(iteminfo.layerType, x, y);
                            this._addMapItem(iteminfo, x, y);
                        }
                    }
                }
                if (tiledData.ground != -1) {
                    this._setMapGround(tiledData.ground, x, y);
                }
            }
            this._defGround = mapData.defGround;
        }
        this._pushEvent(EventDef.EVENT_SET_DEFGROUND, this._defGround);
    }

    //保存地图到文件
    _saveMapToFile() {
        let mapData = new MapBuffer(this._fileName, this._widthCount, this._highCount, this._defGround);
        this._mapItemData.eachMap(
            function (tiledInfo) {
                if (tiledInfo.ground == Config.BiomeType.DEF &&
                    tiledInfo.mapItem[0] == null &&
                    tiledInfo.mapItem[1] == null) {
                    return;
                }

                let data = mapData.getData(tiledInfo.x, tiledInfo.y)
                for (const item of tiledInfo.mapItem) {
                    if (item == null) continue;
                    data.itemID[item.LayerType] = item.ItemID;
                }
                data.ground = tiledInfo.ground;
            }
        )
        mapData.saveToFile();

        this._pushEvent(EventDef.EVENT_SHOW_PROMPT, { info: '地图信息已保存', type: 1 });
    }

}
