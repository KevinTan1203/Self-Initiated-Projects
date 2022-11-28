"""Import dependencies"""
import dash_html_components as html
import dash_bootstrap_components as dbc
import dash_core_components as dcc
import plotly.express as px
import plotly.graph_objs as go
import yfinance as yf
import pandas as pd
import numpy as np
import dash
import sys
from dash.dependencies import Input, Output
from codeName import configuration
from financials import *
from styles import styleConfig
from updateGraph import *
 
"""Query formula: yf.download(tickers = <argument>, period = <argument>, interval = <argument>)
Minutes             Argument         Hours          Argument            Days            Argument
1 minute    ->      1m               1 hour   ->    1h                  1 day    ->     1d
2 minute    ->      2m                                                  5 days   ->     5d
5 minute    ->      5m               Months         Argument
15 minute   ->      15m              1 month  ->    1mo                 Weeks           Argument
30 minute   ->      30m              3 month  ->    3mo                 1 week   ->     1wk
90 minute   ->      90m
"""

"""Initialise Dash"""
app = dash.Dash(__name__, external_stylesheets=[dbc.themes.CYBORG])

options_dict = configuration['options_dict']
discrete_colours = configuration['discrete_colours']
stock_code_dict = configuration['stock_code_dict']

app.layout = html.Div([
    html.H2(
        "Dashboard Visualisation", style={'text-align': 'center'}
    ),
    html.H5(
        "A mini project to mimic the simulation of a real-life stock analysis software tool", 
        style=styleConfig['main-header']
    ),
    html.Div(
        [
            'Select a stock to view',
            dcc.Dropdown(
                id = "stock/crypto/etf", 
                multi = False,
                options = [{'label': opt, 'value': opt} for opt in options_dict['stock/crypto/etf']],
                style = styleConfig['dropdown-text'],
                searchable = False,
                placeholder = "Stock"
            ),
        ],
        style=styleConfig['mini-header']
    ),
    html.Div(
        [
            'Select a time period',
            dcc.Dropdown(
                id = "period", 
                multi = False,
                options = [{'label': opt, 'value': opt} for opt in options_dict['period']], 
                style = styleConfig['dropdown-text'], 
                searchable = False, 
                placeholder = "Time period"
            )
        ],
        style=styleConfig['mini-header']
    ),
    html.Div(
        [
            'Chart Type',
            dcc.Dropdown(
                id = "chart type", 
                multi = False,
                options = [{'label': opt, 'value': opt} for opt in options_dict['chart type']],
                value = 'Default',
                style = styleConfig['dropdown-text'], 
                searchable = False, 
                placeholder = "Chart type",
            )
        ],
        style=styleConfig['mini-header']
    ),
    html.Div(
        [
            'Time Interval',
            dcc.Dropdown(
                id = "interval", 
                multi = False,
                options = [{'label': opt, 'value': opt} for opt in options_dict['interval']], 
                value = '1d',
                style = styleConfig['second-row-selection'],
                searchable = False, 
                placeholder = "Select an interval",
            )
        ],
        style=styleConfig['mini-header']
    ),
    html.Div(
        [
            'Moving Day Averages',
            dcc.Dropdown(
                id = "moving average", 
                multi = True,
                options = [{'label': opt, 'value': opt} for opt in options_dict['moving average']],
                value = 'NIL',
                style = styleConfig['second-row-selection'], 
                searchable = False, 
                placeholder = "Select moving average",
            )
        ],
        style=styleConfig['mini-header']
    ),
    html.Br(),
    html.Div(id = 'output_container', children = []),
    dcc.Graph(id = "stock_chart", figure = {}),
    dcc.Graph(id = "Percentage_change_chart", figure = {})
])


"""Connect Plotly graphs with Dash Components"""
@app.callback(
    [
        Output(component_id = 'output_container', component_property = 'children'),
        Output(component_id = 'stock_chart', component_property = 'figure'),
        Output(component_id = 'Percentage_change_chart', component_property = 'figure')
    ],
    [
        Input(component_id = 'stock/crypto/etf', component_property = 'value'),
        Input(component_id = 'period', component_property = 'value'),
        Input(component_id = 'interval', component_property = 'value'),
        Input(component_id = 'moving average', component_property = 'value'),
        Input(component_id = 'chart type', component_property = 'value')
    ]
)

def update_graph(stock, period, interval, moving_avg, type):
    # Create API call
    if stock in list(stock_code_dict.keys()):
        stock = stock_code_dict[stock]
    container = "Stock: {} -- Period: {} -- Interval: {}".format(stock, period, interval)
    stock_df = yf.download(tickers=str(stock), period=str(period), interval=str(interval))

    # Chart Type
    if type == 'Default':
        fig = go.Figure()
        fig = defaultGraph(fig, stock_df, stock)
    elif type == 'Candlestick':
        fig = go.Figure(
            data = [
                CandleStickGraph(stock_df, stock)
            ] 
        )
    elif type == 'OHLC':
        fig = go.Figure(
            data = [
                OhlcGraph(stock_df, stock)
            ]
        )

    # Moving Average
    fig = moving_average(fig, moving_avg, discrete_colours, stock_df) 

    # Updating graph
    fig = mainUpdate(fig, stock)
    fig.update_xaxes(rangeslider_visible=True)

    # Percentage change
    stock_df_dup = stock_df.copy()
    fig2 = visualise(percentage_change(stock_df_dup, 1, 'Open'), 'Percentage')

    return container, fig, fig2


if __name__ == '__main__':
    app.run_server(debug=True, host='127.0.0.1')
