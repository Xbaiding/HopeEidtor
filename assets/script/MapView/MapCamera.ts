
/**
 * 镜头控制组件 用于提供各种操作信息
 */

//操作类型枚举
export enum OperateType {
    Null,
    Touch,      //点击
    Move,       //移动
    Scale,      //缩放
    Hold,       //长按
    HoldMove,   //长按移动
    HoldEnd,    //长按结束
}

//操作结果信息
export class CameraEvent extends Object {
    pos: cc.Vec2;
    type: OperateType;
    scale: number;
}

const { ccclass, property } = cc._decorator;

@ccclass
export class MapCamera extends cc.Component {

    @property(cc.Camera)
    Camera: cc.Camera = null;
    @property({ type: cc.Float, min: 0, max: 30, slide: true, displayName: '移动灵敏度' })
    Sensitivity: number = 0;
    @property({ type: cc.Float, min: 0.5, max: 2, slide: true, displayName: '长按响应时间' })
    HoldTime: number = 0.5;
    @property({ displayName: '最小缩放值' })
    MinScale: number = 1;
    @property({ displayName: '最大缩放值' })
    MaxScale: number = 2;
    @property({ type: cc.Component.EventHandler, displayName: '响应事件' })
    TouchEvent: cc.Component.EventHandler[] = [];

    _beginPos: cc.Vec2 = null;
    _touchPos: Array<{ id: number, pos: cc.Vec2 }> = [];
    _beginScale: number = 1;
    _curScale: number = 1;
    _canScale: boolean = true;

    _distance_before: number = -1;              //间距
    _holdTimeEclipse: number = -1;              //用来检测长按
    _holdClick: boolean = false;                //用来检测点击
    _opType: OperateType = OperateType.Null;    //操作类型
    _changOpType(opType: OperateType) {
        this._opType = opType;
        this._holdClick = (opType == OperateType.Touch);
        this._holdTimeEclipse = 0;
    }
    _isHold() { return (this._opType == OperateType.Hold || this._opType == OperateType.HoldMove); }
    onLoad() {
        this._touchPos[0] = { id: -1, pos: cc.v2(0, 0) };
        this._touchPos[1] = { id: -1, pos: cc.v2(0, 0) };
        this._curScale = 1 / this.Camera.zoomRatio;
        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouchCancel, this);
        this.node.on(cc.Node.EventType.MOUSE_WHEEL, this._onMouseWheel, this);
        //当缩放系数相同时不可缩放
        if (this.MinScale == this.MaxScale) {
            this._canScale = false;
        }
    }
    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this._onTouchCancel, this);
        this.node.off(cc.Node.EventType.MOUSE_WHEEL, this._onMouseWheel, this);
    }

    _onTouchStart(event: cc.Event.EventTouch) {
        if (this._isHold()) return;

        if (this._touchPos[0].id == -1 && this._touchPos[1].id == -1) {
            this._changOpType(OperateType.Touch);    //开始点击
        }
        this._beginPos = event.getLocation()

        if (!this._canScale)
            return;

        //记录初始触摸坐标
        if (this._touchPos[0].id == -1) {
            this._touchPos[0] = { id: event.getID(), pos: this._beginPos }
        } else if (this._touchPos[1].id == -1) {
            this._touchPos[1] = { id: event.getID(), pos: this._beginPos }
        } else {
            return; //超过2个点就不处理了
        }

        if (this._touchPos[0].id != -1 && this._touchPos[1].id != -1) {
            this._beginScale = this.Camera.zoomRatio;
            let pos1 = this._touchPos[0].pos,
                pos2 = this._touchPos[1].pos;
            this._distance_before = this._getDistance(pos1, pos2);
            this._changOpType(OperateType.Scale);    //可两指缩放
        }
    }
    _onTouchMove(event: cc.Event.EventTouch) {
        let offPos = event.getDelta();
        if (offPos.x == 0 && offPos.y == 0) return; //屏蔽无意义的回调响应

        if (this._isHold()) {
            this._opType = OperateType.HoldMove;
            this._onEventHandler(event.getLocation());
            return;
        }

        //灵敏度控制防止轻微移动而不触发长按长按操作
        if (Math.abs(offPos.x) + Math.abs(offPos.y) < this.Sensitivity) return

        //更新触摸点坐标
        if (event.getID() == this._touchPos[0].id) {
            this._touchPos[0].pos = event.getLocation();
        } else if (event.getID() == this._touchPos[1].id) {
            this._touchPos[1].pos = event.getLocation();
        }

        switch (this._opType) {
            case OperateType.Touch:
            case OperateType.Move:
                this.setPosition(offPos)
                this._changOpType(OperateType.Move);
                break;
            case OperateType.Scale:
                let distance_after = this._getDistance(this._touchPos[0].pos, this._touchPos[1].pos);
                this._setScale(distance_after / this._distance_before);
                break;
            default:
                break;
        }
    }
    _onTouchEnd(event: cc.Event.EventTouch) {
        if (event.getID() == this._touchPos[0].id) {
            this._touchPos[0].id = -1;
        } else if (event.getID() == this._touchPos[1].id) {
            this._touchPos[1].id = -1;
        }

        if (this._touchPos[0].id == -1 && this._touchPos[1].id == -1) {
            if (event.type == 'touchend' && this._isHold()) {
                this._changOpType(OperateType.HoldEnd);
            }
            this._onEventHandler(event.getLocation());
            this._changOpType(OperateType.Null);
        }
    }
    _onTouchCancel() {
        this._changOpType(OperateType.Null);
        this._touchPos[0].id = -1;
        this._touchPos[1].id = -1;
    }
    _onMouseWheel(event: cc.Event.EventMouse) {
        this.setScale(1 + event.getScrollY() * 0.1)
    }

    public initCamera() {
        this.Camera.zoomRatio = 1;
        this.Camera.node.setPosition(cc.v2())
    }

    /**
     * 设置相机位置
     * @param diff 改变的系数
     */
    public setPosition(diffPos: cc.Vec2) {
        diffPos.mulSelf(this._curScale);
        let oldPos = this.Camera.node.position;
        this.Camera.node.setPosition(oldPos.sub(diffPos))
    }

    /**
     * 设置相机缩放
     * @param diff 改变的系数
     */
    public setScale(diff: number) {
        this._beginScale = this.Camera.zoomRatio;
        this._setScale(diff);
    }

    private _setScale(diff: number, ) {
        let scale = this._beginScale * diff;
        if (scale <= this.MinScale)
            scale = this.MinScale;
        else if (scale >= this.MaxScale)
            scale = this.MaxScale;

        this._curScale = 1 / scale;
        this.Camera.zoomRatio = scale;
    }

    //两点间距离
    _getDistance(pos1: cc.Vec2, pos2: cc.Vec2) {
        let distance = Math.pow((pos1.x - pos2.x), 2) + Math.pow((pos1.y - pos2.y), 2);
        return Math.sqrt(distance);
    }

    update(dt) {
        if (this._opType != OperateType.Touch)
            return;

        if (this._holdClick && this._holdTimeEclipse < this.HoldTime) {
            this._holdTimeEclipse += dt;
            if (this._holdTimeEclipse > this.HoldTime) {
                this._changOpType(OperateType.Hold);// 长按
                this._onEventHandler(this._beginPos);
            }
        }
    }

    //响应回调
    _onEventHandler(pos: cc.Vec2) {
        if (this.TouchEvent.length == 0) return;
        let worldPos = this.Camera.getScreenToWorldPoint(pos);    //getScreenToWorldPoint
        cc.Component.EventHandler.emitEvents(this.TouchEvent, { pos: worldPos, type: this._opType, scale: this._curScale });
    }
}
