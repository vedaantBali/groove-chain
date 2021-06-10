import React from 'react';

const Transaction = ({ transaction}) => {
    const { input, outputMap } = transaction;
    const receivers = Object.keys(outputMap);

    return (
        <div>
            <div>From: {`${input.address.substring(0, 20)}...`} | Balance: {input.amount}</div>
            {
                receivers.map(receiver => (
                    <div key={receiver}>
                        To: {`${receiver.substring(0, 20)}...`} | Sent: {outputMap[receiver]}
                    </div>
                ))
            }
        </div>
    );
}

export default Transaction;