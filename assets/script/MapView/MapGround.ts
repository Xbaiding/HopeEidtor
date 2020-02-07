

const { ccclass, property } = cc._decorator;

import SpriteMsg from '../GameMsg/SpritesMsg';

//自定义随机函数
const A:number = 1103515245;
const B:number = 12345;
const M:number = 32767;
class Random 
{
    private static r:number = 1;
    public static set seed(value:number){
        Random.r = value;
    }
    public static get random():number{
        Random.r = ((Random.r * A + B)%M) / M;
        return Random.r;
    }
}

@ccclass
export default class BackGround extends cc.Component {

    @property(cc.Prefab)
    ItemPrefab: cc.Prefab = null;
    _itemList: Array<cc.Node> = [];
    //初始化创建所有地皮节点
    _initGround(data:cc.Size) {
        this.node.destroyAllChildren();
        Random.seed = 1;
        this._itemList = [];
        //从左到右从上至下一次创建保证层级关系
        for (let y = 0; y < data.height; y++) {
            for (let x = 0; x < data.width; x++) {
                let item = cc.instantiate(this.ItemPrefab);
                if (item) {
                    this._itemList[y * 100 + x] = item;
                    this.node.addChild(item);
                    let tag = Math.floor(Random.random*32);
                    item.name = String(tag);
                }
            }
        }
    }
    //设置贴图
    _onSetGround(_type: number, x: number, y: number) {
        let item = this._itemList[100 * y + x];
        if (item) {
            let node = item.getChildByName("Sprite")
            let sprite = node.getComponent(cc.Sprite);
            let res = SpriteMsg.getInstance().getBiomeSpriteFrame(_type,Number(item.name));
            if (res != null) {
                sprite.spriteFrame = res;
            }
        }
    }    

}
