1] How big is the data
-> df.shape()

2] How does data look
-> df.head()
# gives the top 5 rows
-> df.sample(5)
# gives 5 random rows

3] What is the data type of the columns
-> df.info()

4] Are there any missing values
-> df.isnull().sum()

5] How does the data look mathematically
-> df.describe()
# gives a high level mathemathical summary

6] Are there duplicate values
-> df.duplicated().sum()
# delete duplicates using drop duplicate function

7] Correlation b/w columns
# removing cols which do not make difference in output
-> df.corr(numeric_only=True)['col name']

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


**  EDA(Exploratory data analysis)

1] Univariate Analysis
# Analysis of one column at a time 

Types of data
a)Numerical: eg age
b)Categorical: eg branch,nationality



A] Categorical data

import pandas as pd
import seaborn as sns

df = pd.read_csv('/train.xls')


 a) CountPlot
 sns.countplot(df['Survived'])
 df['Survived'].value_counts().plot(kind='bar')


 b) Piechart
df['Pclass'].value_counts().plot(kind='pie',autopct='%.2f')




B] Numerical data

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
df = pd.read_csv('/content/train.xls')

a) Histogram
plt.hist(df['Age'])

b) Displot
s]ns.displot(df['Age'])

c) Boxplot
sns.boxplot(df['Age'])




2] Bivariate and multivariate Analysis


import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
titanic = pd.read_csv('/content/train.xls')
tips=sns.load_dataset('tips')
flights=sns.load_dataset('flights')
iris=sns.load_dataset('iris')

flights.head()

1] Scatterplot (Nmerical - Numerical)
sns.scatterplot(x='total_bill',y='tip',data=tips,hue=tips['sex'],style=tips['smoker'],size=tips['size'])
plt.show()

2]Bar plot  (Numericall - Categorical)
sns.barplot(x=titanic['Pclass'],y=titanic['Age'],hue=titanic['Sex'])
plt.show()

3]Box plot (Numerical - Categorical)
sns.boxplot(x=titanic['Sex'],y=titanic['Age'],hue=titanic['Survived'])
plt.show()

4] Displot (Num - Cat)
sns.displot(x=titanic[titanic['Survived'] == 0]['Age'])
plt.show()
sns.distplot(x=titanic[titanic['Survived'] == 0]['Age'],hist=False)
sns.distplot(x=titanic[titanic['Survived'] == 1]['Age'],hist=False)

5] HeatMap (cat - cat)

sns.heatmap(pd.crosstab(titanic['Pclass'],titanic['Survived']))

titanic.groupby('Sex').mean(numeric_only=True)['Survived'] * 100

6] ClusterMao (cat - cat)

sns.clustermap(pd.crosstab(titanic['Parch'],titanic['Survived']))

7] Pairplot {does scatterplot for all columns}

iris.head()

sns.pairplot(iris,hue='species')

8] Lineplot (Num - NUme)
use for time based

flights.head()
new=flights.groupby('year').sum(numeric_only=True).reset_index()

sns.lineplot(x=new['year'],y=new['passengers'])

sns.heatmap(flights.pivot_table(index='month',columns='year',values='passengers'))
sns.clustermap(flights.pivot_table(index='month',columns='year',values='passengers'))


-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

To Make Html website to view and understand the data wholly


from ydata_profiling import ProfileReport
profile=ProfileReport(df,title='Pandas Profiling Report')
profile.to_file(output_file='output.html')


