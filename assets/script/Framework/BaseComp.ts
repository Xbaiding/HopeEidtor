
//基础组件
//继承后方便注册监听事件

const { ccclass } = cc._decorator;

import EventMsg from './EventMsg'

@ccclass
export default class BaseComp extends cc.Component {

    //事件注册
    _register(id: number, callBack: any) {
        EventMsg.on(id,callBack,this);
    }
    
    //事件注销
    _destroy(id: number, callBack: any) {
        EventMsg.off(id,callBack,this);
    }

    //推送事件
    _pushEvent(event: number, data?: any) {
        EventMsg.emit(event,data);
    }
}