
//贴图管理器

const { ccclass, property,requireComponent } = cc._decorator;

import PersistNode from '../Extend/PersistNode'

@ccclass
@requireComponent(PersistNode)
export default class SpritesMsg extends cc.Component {

    private static _instance: SpritesMsg;
    public static getInstance(): SpritesMsg {
        if (this._instance == null) {
            this._instance = new SpritesMsg();
        }
        return this._instance;
    }
    private constructor() {
        super();
    }
    __preload() {
        if (SpritesMsg._instance == null) {
            SpritesMsg._instance = this;
        }
    }

    @property({ type: cc.SpriteAtlas })
    BiomeAtlas: cc.SpriteAtlas = null;      //地形图集
    @property({ type: cc.SpriteAtlas })
    MapAtlas: cc.SpriteAtlas = null;        //物品图集

    _biomeKeyList: Array<string> = [];
    onLoad() {
        //初始化地形key值名称
        for (let type = 0; type < 7; type++) {
            for (let index = 1; index <= 32; index++) {
                let key = 'biome_' + type + '_';
                if (index < 10) {
                    key += '0'
                    key += index;
                } else {
                    key += index;
                }
                this._biomeKeyList.push(key);
            }
        }
    }
    public getBiomeSpriteFrame(type: number, index: number): cc.SpriteFrame {
        let key = this._biomeKeyList[type * 32 + index];
        return this.BiomeAtlas.getSpriteFrame(key)
    }
    _customSprite:cc.SpriteFrame[] = [];
    public addMapSpriteFrame(key: string,sp:cc.SpriteFrame){
        this._customSprite[key] = sp;
    }
    public getMapSpriteFrame(key: string,custom?:boolean): cc.SpriteFrame {
        if(custom)return this._customSprite[key];
        return this.MapAtlas.getSpriteFrame(key)
    }
}
