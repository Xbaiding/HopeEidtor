
//事件消息机

class EventMsg extends cc.EventTarget{
        private static _instance: EventMsg = null;
        public static get instance(): EventMsg {
            if (this._instance == null) {
                this._instance = new EventMsg();
            }
            return this._instance;
        }

    private constructor() { 
        super();
    }
}
export default EventMsg.instance;