import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./utils/getWeb3";

import "./App.css";

var truffle_contract = require("truffle-contract");

class App extends Component {
  state = { 
    web3: null, 
    accounts: null, 
    storage_contract: null,
  };

  componentDidMount = async () => {
    let web3;
    try {
      // Get network provider and web3 instance.
      web3 = await getWeb3();
    } catch (error) {
      console.error(error);
      alert(
        `Something went wrong getting web3: ` + error,
      );
      return;
    }

    let accounts;
    try {
      accounts = await web3.eth.getAccounts();
    } catch (error) {
      console.error(error);
      alert(
        `Something went wrong loading accounts from [` + 
        web3.currentProvider.host + 
        `]: ` + 
        error,
      );
      return;
    }

    try {
      // We're just going the store the 'spec' of the contract. It not a
      // particular instance of a deployed contract. Need the address to do that
      var storage_contract_spec = truffle_contract(SimpleStorageContract);
      storage_contract_spec.setProvider(web3.currentProvider);
      var storage_contract = await storage_contract_spec.deployed();
      
      // Set web3, accounts, and contract to the state so that other 
      // components can access it
      this.setState({ web3, accounts, storage_contract });
      
    } catch (error) {
      console.error(error);
      alert(
        `Something went wrong loading the contract: ` + error,
      );
      return;
    }
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    let cp = this.state.web3.currentProvider;
    let connection_status;
    if (cp.isMetaMask) {
      connection_status = 
        <div>
          <h5>Connected to MetaMask...</h5>
          <ul>
            <li><code>web3.currentProvider.isMetaMask</code>: {cp.isMetaMask.toString()}</li>
            <li><code>web3.currentProvider.isConnected()</code>: {cp.isConnected().toString()}</li>
            <li><code>web3.currentProvider.selectedAddress</code>: {cp.selectedAddress}</li>
          </ul>
        </div>;
    } else {
      connection_status = 
        <div>
          <h5>Connected to local provider...</h5>
          <ul>
            <li><code>web3.currentProvider.connected</code>: {cp.connected.toString()}</li>
            <li><code>web3.currentProvider.host</code>: {cp.host.toString()}</li>
          </ul>
        </div>;
    }
    return (
      <div class="container">
        <div class="row">
          <div class="col-12">
            <h2>React+Data Starter Box</h2>
            <hr/>
          </div>
        </div>

        <div id="simple_storage_box" class="row">
        <div class="col-12">
          <div class="panel panel-default">
          

            <div class="panel-body">
              <h3>web3</h3>
              {connection_status}

              <h3 class="panel-title">SimpleStorage</h3>
              <ul>
                <li><code>storage_contract.address</code>: {this.state.storage_contract.address}</li>
              </ul>

              <hr/>

              <ValueToStoreForm 
                storage_contract={this.state.storage_contract} 
                account={this.state.accounts[0]} />
              <hr/>

              <GetStoredValue
                storage_contract={this.state.storage_contract} 
                account={this.state.accounts[0]} />    

              <hr/>
            </div>

          </div>
        </div>
      </div>
    </div>
    );
  }
}

export default App;

class ValueToStoreForm extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.input = React.createRef();
    this.state = {
      storage_contract: this.props.storage_contract,
      account: this.props.account,
      transactionHash: "nothing yet",
      blockHash: "nothing yet",
      blockNumber: "nothing yet",
      gasUsed: "nothing yet",
    }
  }

  handleSubmit = async (event) => {
    event.preventDefault();

    const { account, storage_contract } = this.state;

    var to_store = this.input.current.value;
    console.log("data: " + to_store);

    const set_response = await storage_contract.setInt(to_store, { from: account });

    this.setState({ 
      transactionHash: set_response.tx,
      blockHash: set_response.receipt.blockHash,
      blockNumber: set_response.receipt.blockNumber,
      gasUsed: set_response.receipt.gasUsed,
     });
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
            <input id="to_store" name="to_store" type="text" class="form-control" placeholder="a uint to store" ref={this.input} />
            <button class="btn btn-primary btn-sm" type="submit">Set it!</button>
        </form>
        <ul>
          <li>transactionHash: {this.state.transactionHash}</li>
          <li>blockHash: {this.state.blockHash}</li>
          <li>blockNumber: {this.state.blockNumber}</li>
          <li>gasUsed: {this.state.gasUsed}</li>
        </ul>
      </div>
    );
  }
}
class GetStoredValue extends React.Component {
  constructor(props) {
    super(props);
    this.handleGet = this.handleGet.bind(this);
    this.state = {
      stored_value: null,
      storage_contract: this.props.storage_contract,
      account: this.props.account,
    }
  }

  handleGet = async (event) => {    
    event.preventDefault();
    const storage_contract = this.state.storage_contract;
    const response = await storage_contract.getInt.call();
    console.log("got: " + response.toNumber());
    this.setState({ stored_value: response.toNumber() });
  }

  render() {
    return (
      <p>
        <button type="submit" onClick={this.handleGet} class="btn btn-primary btn-sm">Get it!</button>
        Stored value: {this.state.stored_value}
      </p>
    );
  }
}

