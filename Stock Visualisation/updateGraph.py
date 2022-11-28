import plotly.graph_objs as go

def CandleStickGraph(dataframe, stockName):
    x_val = dataframe.index
    open_col, high_col, low_col, close_col = dataframe.Open, dataframe.High, dataframe.Low, dataframe.Close
    chart = go.Candlestick(
                x = x_val, 
                open = open_col,
                high = high_col, 
                low = low_col,
                close = close_col, 
                name = "{} - Candlestick".format(stockName),
                increasing_line_color = 'cyan',
                decreasing_line_color = 'gray'
            )
    return chart

def OhlcGraph(dataframe, stockName):
    x_val = dataframe.index
    open_col, high_col, low_col, close_col = dataframe.Open, dataframe.High, dataframe.Low, dataframe.Close
    chart = go.Ohlc(
                x = x_val, 
                open = open_col, 
                high = high_col, 
                low = low_col,
                close = close_col, 
                name = "{} - PHLC".format(stockName)
            )
    return chart

def defaultGraph(fig, dataframe, stockName):
    colsOfInterest = {
        'Open':'#FFFFFF',
        'High':'#4DBFFF',
        'Low':'#00ffe3',
    }
    for key, value in colsOfInterest.items():
        fig.add_trace(
            go.Scatter(
                x = dataframe.index,
                y = dataframe[key], 
                name = "{} {}".format(key, stockName),
                line = dict(color=value), 
                opacity = 0.9,
            )
        )
        fig.update_traces(line=dict(width=0.5))
    return fig

def mainUpdate(fig, stockName):
    fig = fig.update_layout(
        width = 1400, 
        height = 800, 
        template = 'plotly_dark',
        title = '{} Stock Price Over Time'.format(stockName),
        xaxis_title = 'Date',
        yaxis_title = 'Price (SGD)',
        legend_title = 'Legend',
        font = dict(
            family = 'Courier New, monospace',
            size = 14,
            color = 'White'
        )
    )
    fig.update_yaxes(fixedrange=False)
    return fig