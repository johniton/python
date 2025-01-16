
class Node:
    def __init__(self,data):
        self.left=None
        self.data=data
        self.right=None

class Tree:
    def createNode(self,data):
            return Node(data)

    def insertNode(self,node,data):
        if node is None:
            return self.createNode(data)
        if node.data>data:
            node.left=self.insertNode(node.left,data)
        else:
            node.right=self.insertNode(node.right,data)
        return node
    
    # left root right
    def traverse_Inorder(self,root):
        if root is not None:
            self.traverse_Inorder(root.left)
            print(root.data)
            self.traverse_Inorder(root.right)

#Driver Code
tree=Tree()
root=tree.createNode(5)
print(root.data)
tree.insertNode(root,2)
tree.insertNode(root,10)
tree.insertNode(root,7)
tree.insertNode(root,15)
tree.insertNode(root,12)
tree.insertNode(root,20)
tree.insertNode(root,30)
tree.insertNode(root,6)
tree.insertNode(root,8)
print("Traverse in order :")
tree.traverse_Inorder(root)
