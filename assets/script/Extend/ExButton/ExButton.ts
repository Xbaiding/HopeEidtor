
//使用shader实现按钮多态

const { ccclass, disallowMultiple, property,menu } = cc._decorator;

enum BtnState {
    NORMAL,
    HOVER,
    PRESSED,
    DISABLED
}

@ccclass
@disallowMultiple
@menu('Extend/ExButton')
export default class ExButton extends cc.Component {

    @property({ type: cc.Sprite })
    target: cc.Sprite = null;

    _interactable: boolean = true;
    @property({ tooltip: '按钮事件是否被响应，如果为 false，则按钮将被禁用。' })
    set interactable(val: boolean) {
        this._interactable = val;
        this._updateState();
    }
    get interactable() {
        return this._interactable;
    }

    @property({ type: cc.Material, tooltip: '普通状态按钮材质' })
    normalMaterial: cc.Material = null;
    @property({ type: cc.Material, tooltip: '按下状态按钮材质' })
    pressedMaterial: cc.Material = null;
    @property({ type: cc.Material, tooltip: '悬停状态按钮材质' })
    hoverMaterial: cc.Material = null;
    @property({ type: cc.Material, tooltip: '禁用状态按钮材质' })
    disabledMaterial: cc.Material = null;

    @property({ type: cc.Component.EventHandler, tooltip: '按钮的点击事件' })
    clickEvents: cc.Component.EventHandler[] = [];

    _pressed: boolean = false;
    _hovered: boolean = false;

    __preload() {
        this._resetState();
    }

    _resetState() {
        this._pressed = false;
        this._hovered = false;
        this._updateState();
    }

    onEnable() {
        if (!CC_EDITOR) {
            this._registerNodeEvent();
        }
    }

    onDisable() {
        this._resetState();
        if (!CC_EDITOR) {
            this._unregisterNodeEvent();
        }
    }

    _registerNodeEvent() {
        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchBegan, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnded, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouchCancel, this);

        this.node.on(cc.Node.EventType.MOUSE_ENTER, this._onMouseMoveIn, this);
        this.node.on(cc.Node.EventType.MOUSE_LEAVE, this._onMouseMoveOut, this);
    }

    _unregisterNodeEvent() {
        this.node.off(cc.Node.EventType.TOUCH_START, this._onTouchBegan, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this._onTouchEnded, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this._onTouchCancel, this);

        this.node.off(cc.Node.EventType.MOUSE_ENTER, this._onMouseMoveIn, this);
        this.node.off(cc.Node.EventType.MOUSE_LEAVE, this._onMouseMoveOut, this);
    }

    _onTouchBegan(event) {
        if (!this.interactable || !this.enabledInHierarchy) return;

        this._pressed = true;
        this._updateState();
        event.stopPropagation();
    }

    _onTouchMove(event) {
        if (!this.interactable || !this.enabledInHierarchy || !this._pressed) return;

        let touch = event.touch;
        let hit = this.node['_hitTest'](touch.getLocation());
        let state = hit ? BtnState.PRESSED : BtnState.NORMAL;
        event.stopPropagation();
    }

    _onTouchEnded(event) {
        if (!this.interactable || !this.enabledInHierarchy) return;

        if (this._pressed) {
            cc.Component.EventHandler.emitEvents(this.clickEvents, event);
            this.node.emit('click', this);
        }
        this._pressed = false;
        this._updateState();
        event.stopPropagation();
    }

    _onTouchCancel() {
        if (!this.interactable || !this.enabledInHierarchy) return;

        this._pressed = false;
        this._updateState();
    }

    _onMouseMoveIn(event: cc.Event.EventMouse) {
        if (this._pressed || !this.interactable || !this.enabledInHierarchy) return;

        if (!this._hovered) {
            this._hovered = true;
            this._updateState();
        }
    }

    _onMouseMoveOut() {
        if (this._hovered) {
            this._hovered = false;
            this._updateState();
        }
    }

    _updateState() {
        if (this.target) {
            let state = this._getButtonState();
            let material = this._getStateMaterial(state);
            if (material) {
                this.target.setMaterial(0, material);
            }
        }
    }

    _getButtonState() {
        let state;
        if (!this.interactable) {
            state = BtnState.DISABLED;
        }
        else if (this._pressed) {
            state = BtnState.PRESSED;
        }
        else if (this._hovered) {
            state = BtnState.HOVER;
        }
        else {
            state = BtnState.NORMAL;
        }
        return state;
    }

    _getStateMaterial(state: BtnState) {
        switch (state) {
            case BtnState.NORMAL:
                return this.normalMaterial;
            case BtnState.HOVER:
                return this.hoverMaterial
            case BtnState.PRESSED:
                return this.pressedMaterial;
            case BtnState.DISABLED:
                return this.disabledMaterial;
        }
    }

}
