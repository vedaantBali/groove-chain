import React, { Component } from 'react';
import { Link } from 'react-router-dom';
// import logo from '../assets/pseudo-logo.png';

class App extends Component {
    state = {
        walletInfo: {}
    };

    componentDidMount() {
        fetch(`${document.location.origin}/api/wallet/info`)
            .then(response => response.json())
            .then(json => this.setState({
                walletInfo: json
            }));
    }

    render() {
        const { address, balance } = this.state.walletInfo;
        return (
            <div className='App'>
                {/* <img className='logo' src={logo}></img> */}
                <br/>
                <div><h3>Welcome to Pseudo-Chain...</h3></div>
                <br/>
                <div>
                    <Link to='/blocks'>Blocks</Link>
                </div>
                <div>
                    <Link to='/conduct-transaction'>Initiate Transaction</Link>
                </div>
                <div>
                    <Link to='transaction-pool'>Transaction Pool</Link>
                </div>
                <br/>
                <div className='WalletInfo'>
                    <div>Your PublicKey: {address}</div>
                    <br/>
                    <div>Balance: {balance} p-coin</div>
                </div>
            </div>
            
        );
    }
}

export default App;