import React, { Component } from 'react';
import * as translate from 'counterpart';
import * as constant from '../constants';

class Result extends Component {
	render() {
		return(
			<div className='law-item'>
				<a href={constant.BASE_URL +
					constant.LAW_URI+ this.props.article.id}>
						<div className='law-title'>
							<a title={this.props.article.title}
								href={constant.BASE_URL + constant.LAW_URI+ this.props.article.id}>
									{this.props.article.title}
							</a>
						</div>
						<div className='law-detail-content'>
							<div className='law-status'>
								<div className='public-day'>
									<div className='sub-title'>
										{translate('app.search.search_tool.order_by.order_by_1')}:
										 {this.props.article.public_day}
									</div>
								</div>
								<div className='effect-day'>
									<div className='sub-title'>
										{translate('app.search.search_tool.order_by.order_by_2')}:
										 {this.props.article.effect_day}
									</div>
								</div>
								<div className='effect-status'>
									<div className='value'>
										{this.props.article.effect_status}
									</div>
								</div>
							</div>
						</div>
				</a>
			</div>
		);
	}
}

export default Result;
