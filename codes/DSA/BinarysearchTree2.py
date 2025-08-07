class Node:
    def __init__(self, info):
        self.info = info  
        self.left = None  
        self.right = None 
        self.level = None 

    def __str__(self):
        return str(self.info) 

def preOrder(root):
    if root == None:
        return
    print (root.info, end=" ")
    preOrder(root.left)
    preOrder(root.right)
    
class BinarySearchTree:
    def __init__(self): 
        self.root = None

#Node is defined as
#self.left (the left child of the node)
#self.right (the right child of the node)
#self.info (the value of the node)

    def insert(self, val):
        if self.root is None:
            self.root=Node(val)
            return
        root=self.root
        while True:
            if val<root.info:
                if root.left is not None:
                    root=root.left
                else:
                    root.left=Node(val)
                    break
            elif val>=root.info:
                if root.right is not None:
                    root=root.right
                else:
                    root.right=Node(val)
                    break

                    

tree = BinarySearchTree()
tree.insert(4)
tree.insert(2)
tree.insert(7)
tree.insert(1)
tree.insert(3)
preOrder(tree.root)
