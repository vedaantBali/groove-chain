import React, { Component } from 'react';
import { FormGroup, FormControl, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import history from '../history';

class ConductTransaction extends Component {
    state = {
        receiver: '',
        amount: 0
    };

    updateReceiver = event => {
        this.setState ({ receiver: event.target.value });
    }

    updateAmount = event => {
        this.setState ({ amount: Number(event.target.value) });
    }

    conductTransaction = () => {
        const { receiver, amount } = this.state;

        fetch(`${document.location.origin}/api/transact`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({ receiver, amount })
        })
            .then(response => response.json())
            .then(json => {
                alert(json.message || json.type);
                history.push('/transaction-pool');
            });
    }

    render() {
        return (
            <div className='ConductTransaction'>
                <Link to='/'>Home</Link>
                <h3>Initiate Transaction</h3>
                <br/>
                <FormGroup>
                    <FormControl 
                        input='text'    
                        placeholder='receiver' 
                        value={this.state.receiver}
                        onChange={this.updateReceiver}
                    />
                </FormGroup>
                <FormGroup>
                <FormControl 
                        input='number'    
                        placeholder='amount' 
                        value={this.state.amount}
                        onChange={this.updateAmount}
                    />
                </FormGroup>
                <div>
                    <Button
                        bsStyle="danger"
                        onClick={this.conductTransaction}
                    >
                        Submit
                    </Button>
                </div>
            </div>
        )
    }
}

export default ConductTransaction;