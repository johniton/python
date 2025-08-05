    
    KNN Imputer
        ->Uses euclidian distance
        -> Steps
            1] Find K nearest neighbors
            2] find the value
            -> We us enan_Euclidian distance
            dist(x,y) = sqrt(weight * sq. distance from present coordinates)
            weight = Total # of coordinates / # of present coordinates
            For example, the distance between [3, na, na, 6] and [1, na, 4, 5] is:
            sqrt(4/2((3-1)^2 + (6-5)^2))

            Advantages
            -> More accurate
            Disadvantages
            -> Time taking due to many calculation
            -> Have to upload data set during production


    Iterative Imputer/ MICE
        -> Multivariate imputation by chained equations
        -> Assumptions
            1] Data Should be missing at random[MAR]
        -> Advantages
            1] high accuracy
        -> Disadvantages
            1] SLow
            2] Training data has to be put on server

        -> Steps
            1] Filling the Nan values wiht the mean of that column : ITERATION 0
            2] Remove all the column1 values which were imputed and use it as the output column on which the prediction models like LR and DT will
                predict the values of the Nan and then fill the value of the prediction in that column1 : ITERATION 1
                ie: col1 = y and col2 to coln = x
            3] do this for all the columns 
            4] Do ITERATION 0 - ITERATION 1 
            5] So we keep doing this till the differenceis not zero of the values which were originally Nan and were replaced by mean and prediction


* 
MCAR → No pattern.

MAR → Pattern exists, and you can detect it using other variables. -> dependent on other columns 

MNAR → Hidden pattern based on the missing value itself — toughest to detect and handle. -> dependent on that column itself
