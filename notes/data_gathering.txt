DATA GATHERING
	1:CSV
	2:JSON/SQL
	3:FETCH API
	4:WEBSCRAPPING



-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------A] CSV



1] OPENING A LOCAL CSV FILE
 
	df = pd.read_csv('name of file')


2] OPENING A CSV FILE USING URL

	
	import request
	from io import StringIO

	url = " PASTE THE URL HERE "
	headers= {"User-Agent":"Mozilla/5.0 (Macintosh;Intel Mac OS X 10.14;rv:66.0) Gecko/20100101 Firefox/66.0"}
	req= requests.get(url,headers=headers)
	data = StringIO(req.text)

	pd.read_csv(data)


3] SEP PARAMETER

	pd.read('name',sep='\t',names=['serial no','genre','rating'])


4] Index_col parameter
# to remove the auto generated index if there is alrady index present
	

	df = pd.read_csv('name of file',index_col='name of the column replacing the default index with')
	
 
5] Headrer paramter
# if the creater of csv made the 0th row with column names

	
	df = pd.read_csv('name of file',header=1)

6] Use_cols parameter
#to filter out columns

	
	df = pd.read_csv('name of file'usecols=['employee number','salary','date of joining','education'])


7] Skip rows paramter
# To skip particle row/rows
	
	df = pd.read_csv('name of file',skiprows[0,1])

# To take n numberof rows
	
	df = pd.read_csv('name of file',nrows=100)


8] Encomding parameter

	df = pd.read_csv('name of file',encoding='')


9] Skip bad lines
# bad lines are skipped

	df = pd.read_csv('name of file',error_bad_lines=false)


10] dtypes paramter

	df = pd.read_csv('name of file',dtype={'target':int})


11] Handling dates
#dates are stored as strings so they are converted to date type so it can be used

	df = pd.read_csv('name of file',parse_dates=['date'])


12] Converters
#using user defined function to modify value

	df = pd.read_csv('name of file',converters={'col name': function})


13] na_values parameters
# - , / , null will be considered NaN values
	
	df = pd.read_csv('name of file',na_values=['-','/','null'])


14] Loading a huge dataset in chunks
dividing into parts so less ram is used

       dfs = pd.read_csv('name of file',chunksize=5000)

       for chunks in dfs:
       		print(chunk.shape)



----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

B] API


	import pandas as pd
	import requests

	response= requests.get('api key')

	df=pd.Dataframe(response.json()['name of the dictionary']).head(2)[['col1','col2','col3']]
	#if more than one page is there then use a fore loop and append the rows

	df.csv('new name for dataset')



# /RapidAPI/ for free api




































