
//操作记录管理器

import AudioMsg from '../Extend/Audio/AudioMsg'
import AudioIndex from '../Extend/Audio/AudioIndex'

//记录类型枚举
export enum RecordType {
    /**添加物品 */
    AddItem,
    /**移除物品 */
    DelItem,
    /**移动物品 */
    MoveItem,
    /**设置地皮 */
    SetGround,
}

//操作记录信息
export class RecordInfo extends Object {
    type: RecordType;   //操作类型
    id: number;         //物品ID
    x: number;          //所在坐标x
    y: number;          //所在坐标y
    val1: number;       //附加参数1
    val2: number;       //附加参数2
    constructor(type: RecordType, id: number, x: number, y: number, val1: number = -1, val2: number = -1) {
        super();
        this.type = type;
        this.id = id;
        this.x = x;
        this.y = y;
        this.val1 = val1;
        this.val2 = val2;
    }
}

export class MapRecordMsg {
    private static _instance: MapRecordMsg;
    public static getInstance(): MapRecordMsg {
        if (this._instance == null) {
            this._instance = new MapRecordMsg();
        }
        return this._instance;
    }
    private constructor() { }

    private recordList: Array<RecordInfo> = [];      //操作记录列表
    private recoveryList: Array<RecordInfo> = [];    //恢复记录列表

    /**
     * 获取撤销操作信息
     */
    public getUnDo(): RecordInfo {
        if (this.recordList.length == 0) {
            return null;
        }
        let info = this.recordList.pop();
        this.recoveryList.push(info);
        return info;
    }
    /**
     * 获取恢复操作信息
     */
    public getReDo(): RecordInfo {
        if (this.recoveryList.length == 0) {
            return null;
        }
        let info = this.recoveryList.pop();
        this.recordList.push(info);
        return info;
    }

    /**
     * 压入操作记录
     * @param info 记录信息
     */
    public pushRecord(info: RecordInfo) {
        this.recordList.push(info);
        if (this.recoveryList.length) {
            this.recoveryList = [];
        }
        AudioMsg.getInstance().playAudio(AudioIndex.ADD_ITEM, 0.5);
    }

    public clearRecord() {
        this.recordList = [];
        this.recoveryList = [];
    }

}
