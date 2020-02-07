
//小地图组件
const { ccclass, property } = cc._decorator;

import SceneMsg from '../GameMsg/SceneMsg'
import EventDef from '../EventDef'
import BaseComp from "../Framework/BaseComp";

@ccclass
export default class MiniMap extends BaseComp {

    @property(cc.Camera)
    camera: cc.Camera = null;
    @property({ type: cc.Component.EventHandler })
    TouchEvent: cc.Component.EventHandler[] = [];
    _curScale: number = null;    //当前缩放系数

    onLoad() {
        this._register(EventDef.EVENT_SET_MINIMAP, this._onHide);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this._onTouch, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._onTouch, this);
        this.node.on(cc.Node.EventType.POSITION_CHANGED, this._onChanged, this);
    }
    onDestroy() {
        this._destroy(EventDef.EVENT_SET_MINIMAP, this._onHide);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this._onTouch, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this._onTouch, this);
        this.node.off(cc.Node.EventType.POSITION_CHANGED, this._onChanged, this);
    }

    start() {
        if (this.camera == null) return;
        this._curScale = this.node.width / SceneMsg.mapSize.width / 100;
        this.camera.zoomRatio = this._curScale;
    }

    _onTouch(event: cc.Event.EventTouch) {
        if (this.TouchEvent.length) {
            let pos = this.node.convertToNodeSpaceAR(event.getLocation());
            pos.mulSelf(1 / this._curScale);
            cc.Component.EventHandler.emitEvents(this.TouchEvent, pos);
        }
    }

    _onChanged() {
        if (this.camera == null) return;
        let canvasSize = cc.Canvas.instance.node.getContentSize();
        let pos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        let x = pos.x / canvasSize.width - 0.5;
        let y = pos.y / canvasSize.height - 0.5;
        this.camera.rect = new cc.Rect(x, y, 1, 1);
    }



    _onHide() {
        let show = this.node.active
        this.node.active = !show;
        this.camera.enabled = !show;
    }
}
