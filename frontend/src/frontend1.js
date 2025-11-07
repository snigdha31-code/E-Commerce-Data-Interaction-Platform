// Import necessary libraries
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from './logo.png';
import CardSlideshow from './CardSlideshow';
import Swal from 'sweetalert2';

// Define the BackendInteraction component
const BackendInteraction = () => {
  // Define states for various variables
  const [operation, setOperation] = useState('');
  const [table, setTable] = useState('');
  const [recordId, setRecordId] = useState('');
  const [formData, setFormData] = useState({});
  const [response, setResponse] = useState([]);
  const [columns, setColumns] = useState([]);
  const [windowFunction, setWindowFunction] = useState('');
  const [windowFunctionResult, setWindowFunctionResult] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [ntileValue, setNtileValue] = useState(0); // Default value for ntile
  const [setOperationTable1, setSetOperationTable1] = useState(''); // Table 1 for set operation
  const [setOperationTable2, setSetOperationTable2] = useState(''); // Table 2 for set operation
  const [setOperationType, setSetOperationType] = useState('');
  const [setColumnName, setSetColumnName] = useState('');
  const [rollupResult, setRollupResult] = useState([]);
  const [showRollupResult, setShowRollupResult] = useState(false);
  const [submitCount, setSubmitCount] = useState(0)
  const [showComplexResult, setShowComplexResult] = useState(false);
  const [complexResult, setComplexResult] = useState([]);


  
  // Effect hook to fetch column names when the table changes
  useEffect(() => {
    if (table) {
      axios.get(`http://localhost:5000/columns/${table}`)
        .then(response => {
          setColumns(response.data);
        })
        .catch(error => {
          console.error('Error fetching columns:', error);
        });
    }
  }, [table]);

  
  // Function to render the window function result
  const renderWindowFunctionResult = () => {
    if (windowFunction && windowFunctionResult !== ''&&windowFunction!='ntile'&&windowFunction!='cume_dist') {
      return (
        <div>
          <h3>{`${windowFunction} Result:`}</h3>
          <p>{windowFunctionResult}</p>
        </div>
      );
    }
    return null;
  };

  // Function to handle change in operation
  const handleOperationChange = (e) => {
    setOperation(e.target.value);
  };

  const fetchComplexResult = async () => {
    try {
      const response = await axios.get('http://localhost:5000/complex');
      setComplexResult(response.data);
      setShowComplexResult(true);
    } catch (error) {
      console.error('Error fetching complex result:', error);
    }
  };

  const handleComplexClick = () => {
    fetchComplexResult();
  };


  const fetchRollupResult = async () => {
    try {
      const response = await axios.get('http://localhost:5000/rollup');
      setRollupResult(response.data);
      setShowRollupResult(true); // Show rollup result section
    } catch (error) {
      console.error('Error fetching rollup result:', error);
    }
  };

  // Handler for button click to fetch rollup result
  const handleRollupClick = () => {
    fetchRollupResult();
  };
  

  // Function to handle change in table selection
  const handleTableChange = (e) => {
    setTable(e.target.value);
  };

  // Function to handle change in record ID input
  const handleRecordIdChange = (e) => {
    setRecordId(e.target.value);
  };

  // Function to handle input change
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Function to handle change in window function selection
  const handleWindowFunctionChange = (e) => {
    setWindowFunction(e.target.value);
    setSelectedColumns([]);
  };

  // Function to handle change in column selection
  const handleColumnChange = (e) => {
    setSelectedColumns(e.target.value);
  };

  const handleSetOperationTypeChange = (e) => {
    setSetOperationType(e.target.value);
  };

  const handleSetOperationTable1Change = (e) => {
    setSetOperationTable1(e.target.value);
  };

  const handleSetOperationTable2Change = (e) => {
    setSetOperationTable2(e.target.value);
  };
  const handleSetInOperationColumnName = (e) => {
    setSetColumnName(e.target.value);
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitCount(submitCount + 1); // Increment submit count

    // Show Swal alert if submit count is greater than 5
    if (submitCount >= 5) {
      Swal.fire({
        icon: 'warning',
        title: 'Oops...',
        text: 'You have reached the maximum number of submissions!',
      });
      return;
    }

    let url = `http://localhost:5000/${table}`;
    if (operation !== 'get_all_records' && operation !== 'create_record' && operation !== 'update_record') {
      url += `/${recordId}`;
    }
    if (operation === 'update_record') {
      // For update operation, use the first value entered as recordId
      url += `/${Object.values(formData)[0]}`;
    }

    try {
      let dataToSend = [];
      if (operation === 'create_record' || operation === 'update_record') {
        dataToSend = Object.values(formData);
      }

      let response;
      if (operation === 'get_all_records' ) {
        // Pass the window function parameter if selected
        const params = windowFunction ? { window_function: windowFunction, selectedColumns: selectedColumns, ntileValue: ntileValue } : {};
        response = await axios.get(url, { params });
        setResponse(response.data.records); // Update response state with records
        setWindowFunctionResult(response.data.window_function_result); // Update window function result
      } else if(operation === 'get_record_by_id') {
        response = await axios.get(url);
        setResponse(response.data);
      } else if (operation === 'create_record') {
        response = await axios.post(url, dataToSend);
        setResponse(response.data);
      } else if (operation === 'update_record') {
        response = await axios.put(url, dataToSend);
        setResponse(response.data);
      } else if (operation === 'delete_record') {
        response = await axios.delete(url);
        setResponse(response.data);
      } else if (operation === 'set_operation') {
        // Perform set operation
        response = await axios.get(`http://localhost:5000/set-operation/${setOperationType}/${setOperationTable1}/${setOperationTable2}`);
        setResponse(response.data.records);
      }

    // Show success alert if no errors
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Operation completed successfully!',
    });
  } catch (error) {
    console.error('Error:', error);
    // Show error alert
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Something went wrong!',
    });
  }
};
  const renderTable = () => {
    if (response === '') {
      return null;
    }

    if (Array.isArray(response)) {
      return (
        <table>
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {response.map((row, index) => (
              <tr key={index}>
                {columns.map(column => (
                  <td key={column}>{row[column]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else {
      return (
        <table>
          <thead>
            <tr>
              {Object.keys(response).map((key, index) => (
                <th key={index}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {Object.values(response).map((value, index) => (
                <td key={index}>{value}</td>
              ))}
            </tr>
          </tbody>
        </table>
      );
    }
  };


  // Return the JSX for rendering the component
  return (
    <div className="container">
      <nav className="top-navbar">
        <ul>
          <li><a href="#">Sign Up</a></li>
          <li><a href="#">Login</a></li>
        </ul>
      </nav>
      <header className="header">
        <img src={logo} alt="eBay Logo" className="logo" />
        <nav className="navigation">
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">Shop</a></li>
            <li><a href="#">Sell</a></li>
            <li><a href="#">Categories</a></li>
            <li><a href="#">Help & Contact</a></li>
          </ul>
        </nav>
      </header>
      <div className="main-content">
        <CardSlideshow />

        <form onSubmit={handleSubmit}>
          {/* Form fields for selecting operation */}
          <div>
            <label htmlFor="operation">Select Operation:</label>
            <select id="operation" value={operation} onChange={handleOperationChange}>
              <option value="">Select</option>
              <option value="get_all_records">Get All Records</option>
              <option value="get_record_by_id">Get Record by ID</option>
              <option value="create_record">Create New Record</option>
              <option value="update_record">Update Record</option>
              <option value="delete_record">Delete Record</option>
              <option value="set_operation">Set Operation</option>
            </select>
          </div>
          {/* Form fields for selecting table */}
          {(operation !== 'set_operation') && (
          <div>
            <label htmlFor="table">Select Table:</label>
            <select id="table" value={table} onChange={handleTableChange} disabled={!operation}>
              <option value="">Select</option>
              <option value="categories">Categories</option>
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
              <option value="lists">Lists</option>
              <option value="sell">Sell</option>
              <option value="include">Include</option>
              <option value="products">Products</option>
              <option value="watchlist">Watchlist</option>
              <option value="adds">Adds</option>
              <option value="cart">Cart</option>
              <option value="payment">Payment</option>
              <option value="orders">Orders</option>
              {/* Add more options for other tables */}
            </select>
          </div>
          )}
          {(operation === 'set_operation') && ( // Show set operation options when set_operation is selected
            <div>
              <div>
                <label htmlFor="setOperationType">Select Set Operation Type:</label>
                <select id="setOperationType" value={setOperationType} onChange={handleSetOperationTypeChange}>
                  <option value="">Select</option>
                  <option value="union">Union</option>
                  {/* <option value="intersection">Intersection</option>
                  <option value="difference">Difference</option> */}
                </select>
              </div>
              <div>
                <label htmlFor="setOperationTable1">Select Table 1:</label>
                <select id="setOperationTable1" value={setOperationTable1} onChange={handleSetOperationTable1Change}>
                <option value="">Select</option>
              <option value="categories">Categories</option>
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
              <option value="lists">Lists</option>
              <option value="sell">Sell</option>
              <option value="include">Include</option>
              <option value="products">Products</option>
              <option value="watchlist">Watchlist</option>
              <option value="adds">Adds</option>
              <option value="cart">Cart</option>
              <option value="payment">Payment</option>
              <option value="orders">Orders</option>
                </select>
              </div>
              <div>
                <label htmlFor="setOperationTable2">Select Table 2:</label>
                <select id="setOperationTable2" value={setOperationTable2} onChange={handleSetOperationTable2Change}>
                <option value="">Select</option>
              <option value="categories">Categories</option>
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
              <option value="lists">Lists</option>
              <option value="sell">Sell</option>
              <option value="include">Include</option>
              <option value="products">Products</option>
              <option value="watchlist">Watchlist</option>
              <option value="adds">Adds</option>
              <option value="cart">Cart</option>
              <option value="payment">Payment</option>
              <option value="orders">Orders</option>
                </select>
              </div>
            </div>
          )}
          {/* Conditional rendering for window function options */}
          {(operation === 'get_all_records') && (
            <div>
              <label htmlFor="windowFunction">Select Window Function:</label>
              <select id="windowFunction" value={windowFunction} onChange={handleWindowFunctionChange}>
                <option value="">None</option>
                <option value="count">Count</option>
                <option value="average">Average</option>
                <option value="ntile">Ntile</option>
                <option value="cume_dist">CUME_DIST</option>
                {/* Add more window function options here */}
              </select>
              {/* Input field for ntile value */}
              {windowFunction === 'ntile' && (
                <div>
                  <label htmlFor="ntileValue">Ntile Value:</label>
                  <input type="number" id="ntileValue" value={ntileValue} onChange={(e) => setNtileValue(e.target.value)} />
                </div>
              )}
            </div>
          )}
          {/* Conditional rendering for column selection */}
          {(operation === 'get_all_records'&& windowFunction) && (
            <div>
              <label htmlFor="column">Select Column:</label>
              <select id="column" value={selectedColumns} onChange={handleColumnChange}>
                <option value="">Select</option>
                {columns.map(column => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>
          )}
          {/* Conditional rendering for record ID input */}
          {(operation !== 'get_all_records' && operation !== 'create_record' && operation !== 'update_record'&&operation !== 'set_operation' ) && (
            <div>
              <label htmlFor="recordId">Enter Record ID:</label>
              <input type="text" id="recordId" value={recordId} onChange={handleRecordIdChange} />
            </div>
          )}
          {/* Conditional rendering for input fields for creating/updating records */}
          {(operation === 'create_record' || operation === 'update_record') && (
            <div>
              {columns.map(column => (
                <div key={column}>
                  <label htmlFor={column}>{column}:</label>
                  <input type="text" id={column} name={column} onChange={handleInputChange} />
                </div>
              ))}
            </div>
          )}
          {/* Button for form submission */}
          <div class="button-container">
          <button type="submit">Submit</button>
          <button onClick={handleRollupClick}>Seller Revenue</button>
          <button onClick={handleComplexClick}>TOP 10 customers</button>
          </div>
        </form>
      </div>
      {/* Display response */}
      <div className="response">
        <h2>Response:</h2>
{/* Conditional rendering based on operation */}
{(operation === 'create_record' || operation === 'update_record' || operation === 'delete_record' || operation === 'get_record_by_id') ? (
  /* Render table for create, update, delete, or get by ID operations */
  renderTable()
) : (
  /* Render window function result for other operations */
  renderWindowFunctionResult()
)}

{response.length > 0 && (
  <table>
    <thead>
      <tr>
        {/* Display column headers */}
        {operation !== 'create_record' && operation !== 'update_record' && operation !== 'delete_record' && operation !== 'get_record_by_id' && (
  <React.Fragment>
    {/* Display column headers */}
    {columns.map(column => (
      <th key={column}>{column}</th>
    ))}
    {/* Display additional column for ntile result */}
    {windowFunction === 'ntile' && <th>ntile_result</th>}
    {windowFunction === 'cume_dist' && <th>CUME_DIST_RESULT</th>}
  </React.Fragment>
)}

      </tr>
    </thead>
    
<tbody>
  {/* Display table rows */}
  {operation !== 'create_record' && operation !== 'update_record' && operation !== 'delete_record' && operation !== 'get_record_by_id' && (
  <React.Fragment>
  {response.map((row, index) => (
    <tr key={index}>

      {/* Display row data */}
      {columns.map(column => (
        <td key={column}>{row[column]}</td>
      ))}
      {/* Display ntile result if applicable */}
      {windowFunction === 'ntile' && (
        <td>{windowFunctionResult[index]}</td>
      )}
      {windowFunction === 'cume_dist' && (
        <td>{windowFunctionResult[index]}</td>
      )}
    </tr>
  ))}
    </React.Fragment>
)}
</tbody>
  </table>
  
        )}
      </div>
      {showRollupResult && (
        <div>
        <h3>Rollup Result:</h3>
        <table>
          <thead>
            <tr>
              <th>SELL_NAME</th>
              <th>Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rollupResult.map((item, index) => (
              <tr key={index}>
                <td>{item.SELL_NAME}</td>
                <td>${item.total_revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    
    {showComplexResult && (
  <div>
    <h3>Complex Query Result:</h3>
    <table>
      <thead>
        {/* Table headers */}
        <tr>
          {/* Adjust based on the structure of complex query result */}
          <th>User Name</th>
          <th>Total Purchases</th>
        </tr>
      </thead>
      <tbody>
        {/* Render rows for complex query result */}
        {complexResult.map((item, index) => (
          <tr key={index}>
            {/* Adjust based on the structure of complex query result */}
            <td>{item.USER_NAME}</td>
            <td>{item.total_purchases}</td>
          </tr>
        ))}
      </tbody>
    </table>         
  </div>
)}
</div>
  );
};

// Export the BackendInteraction component
export default BackendInteraction;
