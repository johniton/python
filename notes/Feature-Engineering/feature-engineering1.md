 data
   - Numerical
   - categorical
   	- nominal -> no relationsip b/w each other (eg: states)
	- ordinal -> some relationship (eg: reviews -> excelent, good , bad)


 
   1] Ordinal Encoding

	from sklearn.preprocessing import OrdinalEncoder
	oe = OrdinalEncoder(categories=[['Poor','Average','Good'],['School','UG','PG']])

	oe.fit(X_train)

	OrdinalEncoder(categories=[['Poor', 'Average', 'Good'], ['School', 'UG', 'PG']])

	X_train = oe.transform(X_train)

	X_train
	
	from sklearn.preprocessing import LabelEncoder

	le = LabelEncoder()

	le.fit(y_train)

	LabelEncoder()

	le.classes_


	array(['No', 'Yes'], dtype=object)

	y_train = le.transform(y_train)
	y_test = le.transform(y_test)

	y_train





   2] OneHotEncoding using sklearn

	from sklearn.preprocessing import OneHotEncoder

	ohe = OneHotEncoder(drop='first',sparse=False,dtype=np.int32)

	X_train_new = ohe.fit_transform(X_train[['fuel','owner']])

	X_test_new = ohe.transform(X_test[['fuel','owner']])

	X_train_new.shape

	np.hstack((X_train[['brand','km_driven']].values,X_train_new))

	counts = df['brand'].value_counts()

	df['brand'].nunique()
	threshold = 100

	repl = counts[counts <= threshold].index

	pd.get_dummies(df['brand'].replace(repl, 'uncommon')).sample(5)



 * Mathematical Transformation
  
  # To make the data follow normal distribution
  
   1] log transform
   2] reciprocal transform
   3] power transform

   sklearn -> 1] function transformer 
   			a) log transform
			b) reciprocal
			c) square or square root
			d) custom Transformation

   	      2] power transformer
	      		a) Box-Cox
			b) yeo-Johnson
	      3] quantile transformer


   # How to find if data is normal
	1] sns.distplot
	2] pd.skew()
	3] QQ plot -> most reliable


  Log Tranform 
   # when to use?
   	1] when data is right skewed and the data is non negative

  square transform
   # when to use?
   	1] when data is left skewed


  Box-Cox transform

  power(Xi,L) = {  (power(Xi,L)-1)/L  if L != 0
  		   ln(Xi)	      if L = 0
		}

_____________________________________________________________________________________________________________________________________________________________________________


 * Numerical Encoding
	1] Binning
		- putting values in discrete ranges
		a) better handing of outliers
		b) to improve value spread
	2] Binarization

	

  1] Binning
  	a) Unsupervised
		1] Equal width(uniform)
		2] Equal frequency(quantile)
		3] K-means

	b) supervised
		1] Decison tree 

	c) custom

-------------------------
	a) Equal width
		bin=X 
		(max-min)/bins
	  
	b) Equal frequency
		total obs = m 
		bin = x 
		-> each interval conatins m/x of observation





















