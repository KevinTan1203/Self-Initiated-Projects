import numpy as np
import pandas as pd
import yfinance as yf
import plotly.graph_objs as go
import plotly.express as px

from sklearn.utils import shuffle

def percentage_change(dataframe, interval, col_change):
    dataframe = dataframe.reset_index()
    
    # Get the percentage change between the given number of days. 
    # Returns a new dataframe with the dates
    dates, value, change, pos_neg = [], [], [], []
    for index in range(0, len(dataframe), interval):
        if index == len(dataframe):
            break
        else:
            try:
                value1, value2 = dataframe.loc[index].at[col_change], dataframe.loc[index + 1].at[col_change]
                dates.append(dataframe.loc[index].at['Date'])
                value.append(value1)
                change.append(round(((value2 - value1) * 100) / value1, 3))
                pos_neg.append(value1 - value2)
            except:
                continue

    return pd.DataFrame(list(zip(dates, value, change, pos_neg)), columns = ['Date', 'Value', 'Percentage', 'Diff'])

def moving_average(fig, moving_avg, discrete_colours, dataframe):
    count = 0
    for i in moving_avg:
        if moving_avg == 'NIL':
            continue
        else:
            dataframe['Rolling_Mean'] = dataframe['Open'].rolling(i).mean().fillna(0)
            dataframe = dataframe[dataframe['Rolling_Mean'] != 0]
            fig.add_trace(
                go.Scatter(
                    x = dataframe.index, 
                    y = dataframe.Rolling_Mean,
                    name = "Moving Average ({})".format(i),
                    line = dict(color = discrete_colours[count]), 
                    opacity = 0.7
                )
            )
            count += 1
    return fig


def regression_modelling(dataframe):
    # Performs an OLS regression model on the stock prices
    # Due to limited data size, we will use volume as a predictor for stock prices
    
    def train_test_split(data, ratio = 0.7):
        shuffle(data)
        return data.iloc[:int(ratio*len(data))], data.iloc[int(ratio*len(data)):]

    return


def run_predictive_forecasting(dataframe):
    # Predicts the price of the stock over the next few days
    return



def visualise(dataframe, column):
    fig = go.Figure()

    # Full line
    if column == 'Percentage':
        # Main line
        fig.add_scattergl(
            x = dataframe.Date, 
            y = dataframe.Percentage, 
            line = {'color': '#00FFD0', 'width': 0.5},
            opacity = 1
        )

        # Above threshhold
        fig.add_scattergl(
            x = dataframe.Date, 
            y = dataframe.Percentage.where(dataframe.Diff >= 0), 
            line = {'color': '#EDFF00', 'width':  0.5},
            opacity = 1
        )

    else:
        fig.add_trace(
            go.Scatter(
                x = dataframe.Date, 
                y = dataframe[column], 
                name = "Chart: {}".format(column),
                line = dict(color = '#1CFFCE', width = 0.5), opacity = 1.0
            )
        )
    fig.update_layout(
        width = 1400, 
        height = 500, 
        template = 'plotly_dark',
        xaxis_title = 'Date', 
        yaxis_title = column + ' (%)',
        font = dict(family = 'Courier New, monospace', size = 14, color = 'White'),
        showlegend = False
    )
    fig.update_yaxes(fixedrange=False)
    return fig