FEATURE ENGINEERING

1] Feature Transformation

	1] Missing value imputation 

		a) removing the missing data
		b) adding data in the empty places

	2] Handling Categorical data
		a) Giving numerical vale to categories
	3] Outlier Detection
	4] Feature Selection

2] Feature Construction
	1] Combinig two or more columns to form a single column
3] Feature Selection
4] Feature Extraction

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 
 * Feature Scaling
    technique to standardize the independent data present in the data in a fixed range
    1] standardization(z-score normalization)
    2] normalization
	
 1] Standardization
  X`i = (Xi-mean(X))/SD

  the mean of the new standardized value = 0
  the SD of the new standardized value = 1
  
  the accuracy never decreases , either equal or more

 Special cases where standardization should ost definitely be applied
 	1] k-means
	2] knn
	3] pca
	4] artificial neural network
	5] gradient descent


 2] Noemalization
    technique often applied as a part of data preparation for machine learning. Goal is to change the numeric valuesof the columns to use a common scale without distorting ranges or losing       information

    Types:
    	1] Min Max Scaling
	2] Mean normalization
	3] Max Absolute
	4] Robust Scaling



	1] Min Max Scaling
		X`i = (Xi-Xmin)/(Xmax-Xmin)
		  Range [0,1]
	
	2] Mean normalization
		X`i + (Xi-mean)/(Xmax-Xmin)
		  Range [-1,1]

	3] Max Absolute
		X`i = Xi/|Xmax|
		useful for sparse data
	
	4] Robust Scaling
		X`i = (Xi - X median)/IQR{75th per-25thper}
		  useful for Outliers






























