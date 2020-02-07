
const { ccclass, property } = cc._decorator;

import * as Config from '../Config'
import BaseComp from "../Framework/BaseComp";
import MapCapture from './MapCapture'
import { OperateType, CameraEvent, MapCamera } from './MapCamera';

import EventDef from '../Eventdef';

@ccclass
export default class MapView extends BaseComp {

    @property(MapCamera)
    MapCamera: MapCamera = null;
    @property(MapCapture)
    MapCapture: MapCapture = null;
    @property(cc.Node)
    MapNode: cc.Node = null;
    @property(cc.Node)
    FrameNode: cc.Node = null;

    @property(cc.Node)
    backLayer: cc.Node = null;
    @property(cc.Node)
    foreLayer: cc.Node = null;
    @property(cc.Node)
    LocalItem: cc.Node = null;

    @property({ type: cc.Integer, min: 10, max: 100 })
    WidthCount: number = 10;
    @property({ type: cc.Integer, min: 10, max: 100 })
    HighCount: number = 10;

    onLoad() {
        this._register(EventDef.EVENT_SCALE_MAP,    this._scaleMap );
        this._register(EventDef.EVENT_HIDE_FRAME,   this._hideFrame );
        this._register(EventDef.EVENT_MOVE_MAP,     this._setMapPoint); 
    }
    onDestroy(){
        this._destroy(EventDef.EVENT_SCALE_MAP,     this._scaleMap );
        this._destroy(EventDef.EVENT_HIDE_FRAME,    this._hideFrame );
        this._destroy(EventDef.EVENT_MOVE_MAP,      this._setMapPoint); 
    }

    _initMap(data: any) {
        this.backLayer.destroyAllChildren();
        this.foreLayer.destroyAllChildren();

        this.WidthCount = data.width;
        this.HighCount = data.height;
        this.MapNode.setContentSize(this.WidthCount * 100, this.HighCount * 100);

        this.MapCapture._mapname = data.name;;
       
        this.MapCamera.initCamera();
    }

    //各类操作信息由 
    onTouchEvent(event: CameraEvent) {
        switch (event.type) {
            case OperateType.Touch:
                this._pushSeclectMapPos(event.pos, EventDef.EVENT_SELECT_MAPPOS);
                break;
            case OperateType.Move:
            case OperateType.Scale:
                break;
            case OperateType.Hold:
                this._pushSeclectMapPos(event.pos, EventDef.EVENT_CLICK_OPERATE);
                break;
            case OperateType.HoldMove:
                if (this.LocalItem.active) {
                    this.LocalItem.setPosition(this.foreLayer.convertToNodeSpaceAR(event.pos));
                    this._pushSeclectMapPos(event.pos, EventDef.EVENT_MOME_ITEM_ON);
                } else {
                    this._pushSeclectMapPos(event.pos, EventDef.EVENT_SELECT_MAPPOS);
                }
                break;
            case OperateType.HoldEnd:
                if (this.LocalItem.active) {
                    this.LocalItem.active = false;
                    this._pushSeclectMapPos(event.pos, EventDef.EVENT_MOME_ITEM_END);
                }
                this._pushEvent(EventDef.EVENT_MOME_ITEM_END, null);
            default:
                break;
        }
    }

    //小地图点击移动
    onMiniTouchEvent(pos:cc.Vec2){
        if (this.MapCamera) {
            this.MapCamera.Camera.node.setPosition(pos);
        }
    }

    /* 添加物品 */
    _addMapItem(layer: Config.LayerType, item: cc.Node) {
        switch (layer) {
            case Config.LayerType.Back: this.backLayer.addChild(item); break;
            case Config.LayerType.Froe: this.foreLayer.addChild(item); break;
            default:
                break;
        }
    }

    _playAddAction(node: cc.Node) {
        new cc.Tween()
            .target(node)
            .set({ opacity: 0, scale: 2, angle: 0 })
            .to(0.5, { opacity: 255, scale: 1 }, { easing: 'quintInOut' })
            .start()
    }

    _pushSeclectMapPos(location: cc.Vec2, event: number) {
        let pos = this.foreLayer.convertToNodeSpaceAR(location);
        let x = Math.floor(pos.x / 100),
            y = Math.floor((- pos.y) / 100);
        if (x < 0 || y < 0 ||
            x >= this.WidthCount ||
            y >= this.HighCount) {
            return;
        }
        pos.x = x; pos.y = y;
        this._pushEvent(event, pos);
    }

    _scaleMap(val: number) {
        this.MapCamera.setScale(val)
    }

    _setMapPoint(data) {
        this.MapCamera.setPosition(data)
    }

    _hideFrame(val: boolean) {
        if (this.FrameNode != null) {
            this.FrameNode.active = val;
        }
    }

}