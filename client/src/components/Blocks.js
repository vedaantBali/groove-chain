import React, { Component } from 'react';
import Block from './Block';
import { Link } from 'react-router-dom';

class Blocks extends Component {
    state = {
        blocks: []
    };

    componentDidMount() {
        fetch(`${document.location.origin}/api/blocks`)
            .then(response => response.json())
            .then(json => this.setState({
                blocks: json
            }));
    }

    render() {
        console.log('this.state', this.state);
        return (
            <div>
                <h3>Blocks</h3>
                <div><Link to='/'>Home</Link></div>
                {
                    this.state.blocks.map(block => {
                        return (
                            <div>
                                <center><Block key={block.hash} block={block}/></center>
                            </div>
                            
                        );
                    })
                }
            </div>
        );
    }
}

export default Blocks;