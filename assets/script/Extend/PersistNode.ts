
//挂在根节点上后该节点会作为常驻节点

const {ccclass,menu} = cc._decorator;
@ccclass
@menu('Extend/PersistNode')
export default class PersistNode extends cc.Component {
    onLoad(){
        cc.game.addPersistRootNode(this.node);
    }
}
