
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
    
    #Inorder =  left root right
    def traverse_Inorder(self,root):
        if root is not None:
            self.traverse_Inorder(root.left)
            print(root.data,end=' ')
            self.traverse_Inorder(root.right)

    #Preorder = root left right
    def traverse_Preorder(self,root):
        if root is not None:
            print(root.data,end=' ')
            self.traverse_Preorder(root.left)
            self.traverse_Preorder(root.right)


    #postorder = left right root      
    def traverse_postOrder(self,root):
        if root is not None:
            self.traverse_postOrder(root.left)
            self.traverse_postOrder(root.right)
            print(root.data,end=' ')



     # Height of a Tree
    def height(self,root):
        if root is None:
            return -1
        return max(self.height(root.left),self.height(root.right)) + 1




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
print()
print("Traverse Pre order :")
tree.traverse_Preorder(root)
print()
print("Traverse post order :")
tree.traverse_postOrder(root)
print()
print('hEIGHT=',tree.height(root))

