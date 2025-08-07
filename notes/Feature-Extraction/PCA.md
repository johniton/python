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

