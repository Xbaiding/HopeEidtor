
//针对列表容器 drawcall 渲染优化

const { ccclass, menu, inspector, executeInEditMode } = cc._decorator;

import ListItem from './ExDrawCall'

const MAX_COUNT = 10;

@ccclass
@executeInEditMode
@menu('Extend/ListContent')
@inspector('packages://inspector/inspectors/comps/cclayout.js')
export default class ListContent extends cc.Layout {

    _curIndex: number = 0;
    _drawNodes: cc.Node[] = [];
    _listItems: { [key: number]: ListItem } = {};

    onEnable() {
        if (!CC_EDITOR) {
            let parent = this.node.parent;
            for (let index = 0; index < MAX_COUNT; index++) {
                let node = new cc.Node()
                node.zIndex = 100;
                node.parent = parent;
                this._drawNodes[index] = node;
            }
        }
        super.onEnable();
    }

    _childAdded(child) {
        let listItem: ListItem = child.getComponent(ListItem);
        if (listItem == null) return;

        if (listItem._index == -1) {
            listItem._index = this._curIndex;
            ++this._curIndex;
            listItem.onInit();
        }
        this._listItems[listItem._index] = listItem;

        //从原先节点摘除放入优化节点
        for (let i = 0; i < listItem.MoveNodes.length; i++) {
            let node = listItem.MoveNodes[i]
            if (node == null) continue;
            const drawNode = this._drawNodes[i];
            node.parent = drawNode;
        }

        super['_childAdded'](child);
    }

    _childRemoved(child) {
        let listItem: ListItem = child.getComponent(ListItem);
        if (listItem == null) return;

        //放回原先节点
        for (let i = 0; i < listItem.MoveNodes.length; i++) {
            let node = listItem.MoveNodes[i]
            if (node == null) continue;
            node.parent = listItem._parent[i];
        }
        delete this._listItems[listItem._index];
        super['_childRemoved'](child);
    }

    _resized() {
        super['_resized']();

        //重新计算坐标
        for (const key in this._listItems) {
            if (this._listItems.hasOwnProperty(key)) {
                const listItem = this._listItems[key];
                for (let index = 0; index < listItem.MoveNodes.length; index++) {
                    let node = listItem.MoveNodes[index]
                    if (node == null) continue;

                    let worldPos = listItem.getWorldSPos(index);
                    const drawNode = this._drawNodes[index];
                    let newPos = drawNode.convertToNodeSpaceAR(worldPos);
                    cc.log(drawNode.y);
                    node.parent = drawNode;
                    node.setPosition(newPos);
                }
            }
        }
    }

}
