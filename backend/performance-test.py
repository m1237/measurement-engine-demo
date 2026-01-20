import threading
import timeit
from datetime import datetime
import eventlet


import plotly.graph_objects as go

strTable = "<html><table><tr><th>Char</th><th>ASCII</th></tr>"

for num in range(33, 48):
    symb = chr(num)
    strRW = "<tr><td>" + str(symb) + "</td><td>" + str(num) + "</td></tr>"
    strTable = strTable + strRW

strTable = strTable + "</table></html>"




'''
def func(a):

    a = a+3
    return a

var = 4
print(var)
var = func(var)
print(var)


def longFunction():
    start_time = datetime.now()
    answer = 1
    a = range(10000)
    for n in a:
        answer = answer * n+1
   # print(answer)
    end_time = datetime.now()
    print(end_time - start_time)
    print('Time complete:' + str(end_time-global_start))


threadList = []
eventletList = []
eventlet.monkey_patch()
global_start = datetime.now()

for i in range(1000):
    thread = threading.Thread(target=longFunction)
    #threadList.append(thread)
    thread.start()


for i in range(1000):
    eventl = eventlet.spawn(func=longFunction())
   # eventletList.append(eventl)
'''