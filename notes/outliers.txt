When are outliers dangerous
    its hard to understand if we should keep the data , remove the data or modify or add new columns to justify

Effects of outliers
     -> Bad effect on  algorithms like
            1] Linear regresson
            2] Logistic regression
            3] Adaboost 
            4] Deep learning
     -> Basically bad for weight based algorithms
     -> Not much effect on Tree based algorithms

How to treat outliers
        1] Trimming
            -> advantage : very fast
            -> disadvantage : reduces the data set
        2] Capping 
            
        3] Treat as missing value

        4] Discritization


How to detect the outliers
        1] If the column is normally distributed then 
        μ-3σ and μ+3σ are the outliers 
        
        2] If the the data is skewed
        Q1-1.5IQR and Q3+1.5IQR are the outliers when Q1=25th percentile and Q3

        3] For any distribution
        if the data is before 5 or 2 percentile or after 97.5 or 99 percentile

Techniques for outlier detection and removal
        1] Z-score treatment
        2] IQR based filtering
        3] Percentile based
        4] Winsorization

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1] Z-score treatment
    Assumptions:
        the data should be normally distributed
        or close to normally distributed , it shouldnt be too skewed

        Zscore value:
            Xi' = (Xi-Xmean)/Standard deviation

        a)Trimming
        b)Capping



2] IQR 
     used for skewed data 
     IQR = 75percentile -25percentile
     upper limit = 75percentile + 1.5*IQR
     lower limit = 25percentile + 1.5*IQR



3] Percentile 
    Make some threshold percentile like 99percentile and 1percentile and either cap or remove the ones which more than 99percentile and less than 1percentile
    upper and lower limit 









