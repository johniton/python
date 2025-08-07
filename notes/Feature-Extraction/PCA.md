 PCA
    -> PCA is a technique which can transfrom a higher dimensional data to lower dimensional data while keeping its essence
    -> Benifits
            1] The data size reduces therefore faster execution of algorithm 
            2] Visualization

    if there are 2 columns and you have to choose 1 of them then plot a scattterplot and take the column which has more projection/variance of the points
    but if the the two columns are identical in varianv=ce then this method of feature selection is not aplicable so we use feature extraction


## we take the projection of the point on the unit vector

![[Pasted image 20250807181339.png]]


## Then we find the  ''u -> unit vector ''  variance using the following formula and consider the points having thr highest variance
![[Pasted image 20250807181729.png]]

## why covariance is better than variance

-> Because it tells use about the spread and the relationshiop between the axes unlike variance which only tells us about the spread

## Covariance Matrix
![[Pasted image 20250807184212.png]]

negative = negatively related
positive= positively related

![[Pasted image 20250807184601.png]]
Diagonal -> how the data is spreaded
symmetric elements -> how the data is oriented 

#### What exactly are matrices
-> They are linear transformation , they transform the current coordinate system having vectors to a different coordinate system where the vector changes

##### what are Eigen vectors
-> these are those vectors whose direction remains same but the magnitude may differ

#### what are eigen values
-> how much an eigen vector shrinks or stretches
![[Pasted image 20250807185658.png]]

#### Why are we doing eigen decomposition 
 -> to get the largest eigen value -> you ll get the eigen vector corresponding to it which h as the highest variance


## Step by Step Solution

#### 1] Mean Centering

#### 2] Find Covariance Matrix

#### 3] Find Eigen value and Eigen vector

![[Pasted image 20250807214914.png]]





### Finding optimal number of  principal ocmponent

![[Pasted image 20250808003222.png]]
## When PCA doesnt work

![[Pasted image 20250808003109.png]]