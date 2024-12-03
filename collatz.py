""""
11. Collatz Conjecture
Write a program that takes a number n and performs the following:

If n is even, divide it by 2.
If n is odd, multiply it by 3 and add 1.
Repeat this process until n becomes 1.
Bonus: Count the number of steps taken and display them.
"""
def main():
    try:
        N=int(input("Enter a Number:"))
    except ValueError:
        print("x is not an integer")
    else: 
        ch=input("Enter y if you want to know the binary equivalent of your number:")
        if(ch=='y'):
            binary(N)
        collatz(N)

def collatz(N):
    x=0
    while(N!=1):
        if(N%2==0):
            N=N//2
            print(N)
        else:
            N=N*3+1
            print(N)
        x=x+1
        
    print("total steps taken = ",x)

def binary(N):
    binary_rep = ""
    while N > 0:
        remainder = N % 2  
        binary_rep = str(remainder) + binary_rep  # Append the remainder to the left
        N = N // 2  # Perform integer division by 2
    print("Your number in Binary =", binary_rep)

main()