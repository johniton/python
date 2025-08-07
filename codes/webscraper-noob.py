import pandas as pd
import requests
from bs4 import BeautifulSoup

headers={'User-Agent':'Mozilla/5.0 (Windows NT 6.3; Win 64 ; x64) Apple WeKit /537.36(KHTML , like Gecko) Chrome/80.0.3987.162 Safari/537.36'}
webpage=requests.get('https://en.wikipedia.org/wiki/Main_Page',headers=headers,timeout=10).text

# lxml is html parser
soup = BeautifulSoup(webpage,'lxml')
for i in soup.find_all('div',class_="hlist inline"):
  print(i.text.strip())
