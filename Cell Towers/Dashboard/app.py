import numpy as np
import pandas as pd
import dash
import json
import plotly.express as px
import geopandas as gpd
import plotly.graph_objects as go
from dash import Dash, html, dcc
from dash.dependencies import Input, Output
from keplergl import KeplerGl

css = 'https://codepen.io/chriddyp/pen/bWLwgP.css'
app = dash.Dash(__name__, external_stylesheets=[css])

with open('../mcc_mapping.json', 'r') as f:
  mcc_mapping = json.load(f)

app.layout = html.Div([
    html.H1('Cell Towers Around the World'),
    dcc.Dropdown(
        id='country-mcc-id',
        multi=False,
        options=[{'label': key, 'value': key} for key in sorted(mcc_mapping.keys())],
        value='Singapore'
    ),
    html.Br(),
    html.Div(id='mcc-country', style={'font-size': '20px'}),
    html.Div(id='mcc-code', style={'font-size': '20px'}),
    dcc.Graph(
        id='graph',
        figure=go.Figure(
            data=[],
            layout=go.Layout(title='Main Graph 1')
        )
    ),
    html.Div([
        dcc.Graph(
            id='graph1',
            figure=go.Figure(
                data=[],
                layout=go.Layout(title='Graph 1')
            )
        )
    ], style={'width': '50%', 'display': 'inline-block'}),
    html.Div([
        dcc.Graph(
            id='graph2',
            figure=go.Figure(
                data=[],
                layout=go.Layout(title='Graph 1')
            )
        )
    ], style={'width': '50%', 'display': 'inline-block'}),
])

@app.callback(
    [
       Output('mcc-country', 'children'), Output('mcc-code', 'children')
    ],
    [
       Input('country-mcc-id', 'value')
    ]
)
def update_outputs(value):
    mcc_cde = mcc_mapping.get(value, 'No value found')
    return dcc.Markdown(f'**Country**: {value}'), dcc.Markdown(f'**MCC Code**: {mcc_cde}')

if __name__ == '__main__':
    app.run_server(debug=True, host='127.0.0.1')