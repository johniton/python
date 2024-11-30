def main():
    x=int(input("Enter a number:"))
    y=int(input("Enter another number:"))
    op=input("Enter a operation:")
    print(f"value={calc(x,y,op)}")

def calc(a,b,op):
    if(op=='x'):
      return(a*b)
    elif(op=='+'):
      return(a+b)
    elif(op=='-'):
      return(a-b)
    elif(op=='/' and b!=0):
        return(a/b)
    elif(op=='%' and b!=0):
       return(a%b)
    else:
       print("invalid")

main()