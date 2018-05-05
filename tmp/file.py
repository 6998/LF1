from __future__ import print_function

import sys

from comet_ml import Experiment


import os
RUNNER_12_8=os.environ['RUNNER_12_8']
RUNNER_11_8=os.environ['RUNNER_11_8']


def main():
		custom_val1 = RUNNER_11_8
		custom_val2 = RUNNER_12_8
		custom_val3 = 123
		custom_val4 = 123
		
		experiment = Experiment(api_key=123, project_name=456);
		experiment.log_parameter("param1", custom_val1)
		experiment.log_parameter("param2", custom_val2)
		experiment.log_parameter("param3", custom_val3)
		experiment.log_parameter("param4", custom_val4)

if __name__ == '__main__':
		main()
