
//弹框提示

const { ccclass, property } = cc._decorator;

import BaseView from '../Framework/BaseView';
import EventDef from '../Eventdef';

type PromptData = { info: string, event: number, type: number };
@ccclass
export default class PromptView extends BaseView {

    @property(cc.Label)
    PromptInfo: cc.Label = null;
    @property(cc.Node)
    ConfirmBtn1: cc.Node = null;
    @property(cc.Node)
    ConfirmBtn2: cc.Node = null;
    @property(cc.Node)
    CancelBtn: cc.Node = null;

    _enent: number = -1;

    onLoad() {
        this._register(EventDef.EVENT_SHOW_PROMPT,this._onShowView )
        this._register(EventDef.EVENT_HIDE_PROMPT,this.onHide );
    }
    onDestroy(){
        this._destroy(EventDef.EVENT_SHOW_PROMPT,this._onShowView )
        this._destroy(EventDef.EVENT_HIDE_PROMPT,this.onHide );
    }

    _onShowView(data: PromptData) {

        this.PromptInfo.string = data.info
        this._enent = data.event;
        
        if (this.ConfirmBtn1 != null && this.ConfirmBtn2 != null && this.CancelBtn != null) {
            let type = data.type ||  0
            if (type == 0) {        //确认 取消
                this.ConfirmBtn1.active = true;
                this.CancelBtn.active = true;
                this.ConfirmBtn2.active = false;
            }else if(type == 1){    //确认
                this.ConfirmBtn1.active = false;
                this.CancelBtn.active = false;
                this.ConfirmBtn2.active = true;
            }else if(type == 2){    //提示无按钮
                this.ConfirmBtn1.active = false;
                this.CancelBtn.active = false;
                this.ConfirmBtn2.active = false;
            }
        }
        this.onShow();
    }

    onConfirmBtn() {
        if (this._enent != null) {
            this._pushEvent(this._enent, 'Confirm');
        }
        this.onHide();
    }
    onCancelBtn() {
        if (this._enent != null) {
            this._pushEvent(this._enent, 'Cancel');
        }
        this.onHide();
    }

}
