from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from flask_cors import CORS
from sqlalchemy import text
import logging
from logging.handlers import RotatingFileHandler

# Initialize the Flask app
app = Flask(__name__)
CORS(app)

# Set up logging
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
handler = RotatingFileHandler("app.log", maxBytes=10000, backupCount=1)
handler.setFormatter(formatter)
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:root@127.0.0.1/ebay'
db = SQLAlchemy(app)

# Define SQLAlchemy models (as per your requirements)
# For example:
# class Customer(db.Model):
#     # Define your fields here
class Base(db.Model):
    __abstract__ = True

    def serialize(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class Categories(Base):
    __tablename__ = 'categories'
    CAT_ID = db.Column(db.Integer, primary_key=True)
    CUST_ID = db.Column(db.Integer, nullable=False)
    CAT_NAME = db.Column(db.String(50), nullable=False)
        
class Customer(Base):
    __tablename__ = 'customer'
    CUST_ID = db.Column(db.Integer, primary_key=True)
    USER_NAME = db.Column(db.String(50), nullable=False)
    EMAIL = db.Column(db.String(120), nullable=False)
    PASSWORD = db.Column(db.String(120), nullable=False)
    ADDRESS = db.Column(db.String(120), nullable=False)
    CARD_BAL = db.Column(db.Float, nullable=False)
    CUST_VALIDITY = db.Column(db.String(50), nullable=False)


class Seller(Base):
    __tablename__ = 'seller'
    SELL_ID = db.Column(db.Integer, primary_key=True)
    SELL_NAME = db.Column(db.String(50), nullable=False)
    SELL_Email = db.Column(db.String(120), nullable=False)
    SELL_PASSWORD = db.Column(db.String(120), nullable=False)
    REVENUE = db.Column(db.Float, nullable=False)

class Lists(Base):
    __tablename__ = 'lists'
    SELL_ID = db.Column(db.Integer, db.ForeignKey('seller.SELL_ID'), primary_key=True)
    CAT_ID = db.Column(db.Integer, db.ForeignKey('categories.CAT_ID'), primary_key=True)

class Sell(Base):
    __tablename__ = 'sell'
    SELL_ID = db.Column(db.Integer, db.ForeignKey('seller.SELL_ID'), primary_key=True)
    PROD_ID = db.Column(db.Integer, db.ForeignKey('products.PROD_ID'), primary_key=True)
    DATE_SOLD = db.Column(db.DateTime, nullable=False)

class Include(Base):
    __tablename__ = 'include'
    CAT_ID = db.Column(db.Integer, db.ForeignKey('categories.CAT_ID'), primary_key=True)
    PROD_ID = db.Column(db.Integer, db.ForeignKey('products.PROD_ID'), primary_key=True)
    QUANTITY = db.Column(db.Integer, nullable=False)

class Products(Base):
    __tablename__ = 'products'
    PROD_ID = db.Column(db.Integer, primary_key=True)
    WATCH_ID = db.Column(db.Integer, db.ForeignKey('watchlist.WATCH_ID'))
    PROD_NAME = db.Column(db.String(50), nullable=False)
    PROD_PRICE = db.Column(db.Float, nullable=False)
    AUTHENTICITY = db.Column(db.String(50), nullable=False)
    PROD_STATUS = db.Column(db.String(50), nullable=False)

class Watchlist(Base):
    __tablename__ = 'watchlist'
    WATCH_ID = db.Column(db.Integer, primary_key=True)
    PROD_ID = db.Column(db.Integer, db.ForeignKey('products.PROD_ID'))
    CAT_ID = db.Column(db.Integer, db.ForeignKey('categories.CAT_ID'))

class Adds(Base):
    __tablename__ = 'adds'
    PROD_ID = db.Column(db.Integer, db.ForeignKey('products.PROD_ID'), primary_key=True)
    CART_ID = db.Column(db.Integer, db.ForeignKey('cart.CART_ID'), primary_key=True)

class Cart(Base):
    __tablename__ = 'cart'
    CART_ID = db.Column(db.Integer, primary_key=True)
    WATCH_ID = db.Column(db.Integer, db.ForeignKey('watchlist.WATCH_ID'))

class Payment(Base):
    __tablename__ = 'payment'
    Pay_ID = db.Column(db.Integer, primary_key=True)
    CUST_ID = db.Column(db.Integer, db.ForeignKey('customer.CUST_ID'))
    PROD_ID = db.Column(db.Integer, db.ForeignKey('products.PROD_ID'))
    CART_ID = db.Column(db.Integer, db.ForeignKey('cart.CART_ID'))
    SELL_ID = db.Column(db.Integer, db.ForeignKey('seller.SELL_ID'))
    AMOUNT = db.Column(db.Float, nullable=False)
    PAY_STATUS = db.Column(db.String(50), nullable=False)

class Orders(Base):
    __tablename__ = 'orders'
    ORDER_ID = db.Column(db.Integer, primary_key=True)
    Pay_ID = db.Column(db.Integer, db.ForeignKey('payment.Pay_ID'))
    PROD_ID = db.Column(db.Integer, db.ForeignKey('products.PROD_ID'))
    PAY_STATUS = db.Column(db.String(50), nullable=False)
    TOTAL_ITEMS = db.Column(db.Integer, nullable=False)
    AMOUNT = db.Column(db.Float, nullable=False)
    
# Create a dictionary to map table names to classes
table_dict = {
    'categories': Categories,
    'customer': Customer,
    'seller': Seller,
    'lists': Lists,
    'sell': Sell,
    'include': Include,
    'products': Products,
    'watchlist': Watchlist,
    'adds': Adds,
    'cart': Cart,
    'payment': Payment,
    'orders': Orders
}

def perform_set_operation(operation, table1_name, table2_name):
    try:
        
        if operation == 'union':
            query = text(f"""SELECT * FROM {table1_name} UNION SELECT * FROM {table2_name}""")
        elif operation == 'intersection':
            query = text(f"""SELECT * FROM {table1_name} INTERSECT SELECT * FROM {table2_name}""")
        elif operation == 'difference':
            query = text(f"""SELECT * FROM {table1_name} EXCEPT SELECT * FROM {table2_name}""")
        
        result = db.session.execute(query)
        column_names = result.keys()
        serialized_records = [dict(zip(column_names, row)) for row in result]
        
        print(serialized_records)
        return {'records': serialized_records}
    except KeyError:

        return {'message': 'Table not found'}, 404


# Route to handle set operations
@app.route('/set-operation/<operation>/<table1>/<table2>', methods=['GET'])
def handle_set_operation(operation, table1, table2):
    return jsonify(perform_set_operation(operation, table1, table2))
# Your backend code remains mostly the same with a small modification in the `get_all_records` function.


def get_all_records(table_name, window_function, selected_column, ntileValue, use_rollup=False):
    try:
        if window_function != 'cume_dist' or window_function != 'ntile' :
            table = table_dict[table_name]
            
            records = table.query.all()
            serialized_records = [record.serialize() for record in records]

        # Implement window functions
        window_function_result = None
        print(selected_column)
        if window_function == 'count':
            query_count = text(f"""SELECT COUNT({selected_column}) FROM {table_name}""")
            result = db.session.execute(query_count)
            window_function_result = result.scalar() 
        elif window_function == 'average':
            query_count = text(f"""SELECT AVG({selected_column}) FROM {table_name}""")
            result = db.session.execute(query_count)
            window_function_result = result.scalar()
        elif window_function == 'ntile':
            ntile_query = text(f"""SELECT NTILE({ntileValue}) OVER (ORDER BY {selected_column})FROM {table_name}""")
            # Execute the query
            result = db.session.execute(ntile_query)
            window_function_result = [row[0] for row in result]
            query = text(f"""SELECT * FROM {table_name} ORDER BY {selected_column}""")
            ans = db.session.execute(query)
            column_names = ans.keys()
            serialized_records = [dict(zip(column_names, row)) for row in ans]
            print(serialized_records)
        elif window_function == 'cume_dist':
            cume_dist_query = text(f"""SELECT ROUND(CUME_DIST() OVER (ORDER BY {selected_column}), 2) FROM {table_name}""")
            result = db.session.execute(cume_dist_query)
            window_function_result = [row[0] for row in result]
            query = text(f"""SELECT * FROM {table_name} ORDER BY {selected_column}""")
            ans = db.session.execute(query)
            column_names = ans.keys()
            serialized_records = [dict(zip(column_names, row)) for row in ans]
        return {'records': serialized_records, 'window_function_result': window_function_result}
    except KeyError:
        return {'message': 'Table not found'}, 404
    
@app.route('/rollup', methods=['GET'])
def handle_rollup_operation():
    try:
        # Define the ROLLUP query
        rollup_query = text("""
SELECT seller.SELL_NAME, SUM(orders.AMOUNT) AS total_revenue
    FROM seller
    JOIN payment ON seller.SELL_ID = payment.SELL_ID
    JOIN orders ON payment.Pay_ID = orders.Pay_ID
    GROUP BY seller.SELL_NAME WITH ROLLUP
        """)
        # Execute the ROLLUP query
        result = db.session.execute(rollup_query)
        column_names = result.keys()
        serialized_records = [dict(zip(column_names, row)) for row in result]
        print(serialized_records)
        # Return the result
        return jsonify(serialized_records)
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/complex', methods=['GET'])
def handle_complex_operation():
    try:
        # Define the complex query
        complex_query = text("""
SELECT
    c.USER_NAME,
    SUM(o.AMOUNT) AS total_purchases
FROM
    customer c
JOIN
    payment py ON c.CUST_ID = py.CUST_ID
JOIN
    orders o ON py.Pay_ID = o.Pay_ID
GROUP BY
    c.USER_NAME
ORDER BY
    total_purchases DESC
LIMIT
    10;
        """)
        # Execute the complex query
        result = db.session.execute(complex_query)
        column_names = result.keys()
        serialized_records = [dict(zip(column_names, row)) for row in result]
        print(serialized_records)
        # Return the result
        return jsonify(serialized_records)
    except Exception as e:
        return {'error': str(e)}, 500

# Endpoint to handle CRUD operations for individual records
@app.route('/<table>/<int:record_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_single_record(table, record_id):
    if request.method == 'GET':
        return get_record_by_id(table, record_id)
    elif request.method == 'PUT':
        data = request.json
        return update_record(table, record_id, data)
    elif request.method == 'DELETE':
        return delete_record(table, record_id)

# Function to get a single record by ID from a table
def get_record_by_id(table_name, record_id):
    try:
        table = table_dict[table_name]
        record = table.query.get_or_404(record_id)
        return jsonify(record.serialize())
    except KeyError:
        return {'message': 'Table not found'}, 404

# Function to create a new record in a table
def create_record(table_name, data):
    try:
        table = table_dict[table_name]
        columns = [column.key for column in table.__table__.columns]
        new_record_data = {columns[i]: value for i, value in enumerate(data)}
        new_record = table(**new_record_data)
        db.session.add(new_record)
        db.session.commit()
        return jsonify(new_record.serialize(),{'message': 'Record Created successfully'}), 201
    except KeyError:
        return {'message': 'Table not found'}, 404


# Function to update a record in a table
def update_record(table_name, record_id, data):
    try:
        table = table_dict[table_name]
        record = table.query.get_or_404(record_id)
        columns = [column.key for column in table.__table__.columns]
        
        # Map index of each value to its corresponding column name
        for i, value in enumerate(data):
            setattr(record, columns[i], value)
        
        db.session.commit()
        return jsonify(record.serialize(),{'message': 'Record Updated successfully'})
    except KeyError:
        return {'message': 'Table not found'}, 404


# Function to delete a record from a table
def delete_record(table_name, record_id):
    try:
        table = table_dict[table_name]
        record = table.query.get_or_404(record_id)
        db.session.delete(record)
        db.session.commit()
        return jsonify({'message': 'Record deleted successfully'})
    except KeyError:
        return {'message': 'Table not found'}, 404

@app.route('/<table>', methods=['GET', 'POST'])
def handle_crud(table):
    if request.method == 'GET':
        window_function = request.args.get('window_function')
        selected_column = request.args.get('selectedColumns')
        ntileValue = request.args.get('ntileValue')
        column_name = request.args.get('column_name')
        value_to_check = request.args.get('value_to_check')
        return jsonify(get_all_records(table, window_function, selected_column, ntileValue))
    elif request.method == 'POST':
        data = request.json
        return create_record(table, data)

@app.route('/columns/<table>', methods=['GET'])
def get_columns(table):
    try:
        table_class = table_dict.get(table)
        if table_class:
            columns = [column.name for column in table_class.__table__.columns]
            return jsonify(columns)
        else:
            return jsonify({'error': 'Table not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store'
    return response
@app.errorhandler(404)
def page_not_found(error):
    app.logger.error('Page not found: %s', (request.path))
    return jsonify({'error': 'Page not found'}), 404

@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error('An error occurred: %s', str(e))
    return jsonify({'error': 'An error occurred'}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)