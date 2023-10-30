import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
import {
  Slider,
  Box,
  TextField,
  Button,
  Container,
  Paper,
  Grid,
  Typography,
  Alert,
  AlertTitle,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Backdrop,
  CircularProgress,
  Tab,
  Tabs,
  List,
  ListItem,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { withStyles } from '@mui/styles';
import './App.css';
import { setTokenSourceMapRange } from 'typescript';
import { Url } from './constant';
import Chart from 'chart.js/auto';
import * as d3 from 'd3';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function formatNumberInExponential(num: number, precision: number): string {
  const exponential = num.toExponential(precision);
  const parts = exponential.split('e'); // 指数を抽出
  const base = parseFloat(parts[0]);
  const exponent = parseInt(parts[1], 10);
  let exponentSuperscript = exponent.toString().replace(/(\d)/g, (match, digit) => {
    const superscriptDigits = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    return superscriptDigits[parseInt(digit)];
  });
  exponentSuperscript = exponentSuperscript.replace(/-/g, '⁻');
  return `${base}×10${exponentSuperscript}`;
}

interface GraphDataPoint {
  x: number;
  y: number;
}

function graphDataPointToCSV(data: GraphDataPoint[]): string {
  const header = ['q', 'Intensity'];
  const csv = [header.join(',')];

  data.forEach((point) => {
    const row = [point.x, point.y];
    csv.push(row.join(','));
  });

  return csv.join('\n');
}

interface Data {
  min: number;
  max: number;
}

const generateCSV = (data: number[]): string => {
  return data.join('\n');
};

const WhiteFontTextField = withStyles({
  root: {
    '& label': {
      color: 'white', // ラベルのフォントカラー
    },
    '& .MuiInput-underline:before': {
      borderBottomColor: 'white', // 下線のフォントカラー（非フォーカス時）
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: 'white', // 下線のフォントカラー（フォーカス時）
    },
    '& .MuiInput-underline:Mui-focused:before': {
      borderColor: 'white', // カーソルが入力欄にある間の下線フォントカラー
    },
    '& .MuiInput-underline:Mui-focused:after': {
      borderColor: 'white', // カーソルが入力欄にある間の下線フォントカラー
    },
    '& .MuiInputBase-input': {
      color: 'white', // フォントカラー
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'white', // 外枠のフォントカラー
    },
  },
})(TextField);

const WhiteMarksSlider = withStyles((theme) => ({
  markLabel: {
    color: 'white', // フォント色を白に設定
  },
}))(Slider);

let marks: any[] = [];
for (let i = 0; i <= 10; i++) {
  marks.push({
    value: i,
    label: (
      <div style={{ color: 'white' }}>
        10<sup>{i}</sup>
      </div>
    ),
  });
}

const tabWidth: number = 100;

const App: React.FC = () => {
  console.log('レンダリング実行');

  const calculateValue = (value: number, index: number) => {
    if (index === 0) {
      return `min\n${Math.floor(10 ** value)}`;
    } else if (index === 1) {
      return `max\n${Math.floor(10 ** value)}`;
    }
    return Math.floor(10 ** value);
  };
  const [initialRender, setInitialRender] = useState<boolean>(true);
  const [open, setOpen] = useState(false);
  const [showInfo, setShowInfo] = useState<string | null>(null);

  const [selectedStandardFile, setSelectedStandardFile] = useState<File>();
  const [standardImageData, setStandardImageData] = useState<string | null>(null);
  const [standardImageRange, setStandardImageRange] = useState<number[]>([0, 5]);
  const [standardImageRangeForm, setStandardImageRangeForm] = useState<number[]>([0, 5]);
  const [selectedBackgroundFile, setSelectedBackgroundFile] = useState<File>();
  const [backgroundImageData, setBackgroundImageData] = useState<string | null>(null);
  const [backgroundImageRange, setBackgroundImageRange] = useState<number[]>([0, 5]);
  const [backgroundImageRangeForm, setBackgroundImageRangeForm] = useState<number[]>([0, 5]);
  const [selectedSampleFile, setSelectedSampleFile] = useState<File>();
  const [sampleImageData, setSampleImageData] = useState<string | null>(null);
  const [sampleImageRange, setSampleImageRange] = useState<number[]>([0, 5]);
  const [sampleImageRangeForm, setSampleImageRangeForm] = useState<number[]>([0, 5]);
  const [centerFlg, setCenterFlg] = useState(false);
  const [centerX, setCenterX] = useState<number>(0);
  const [centerY, setCenterY] = useState<number>(0);
  const [loadingGetCenterAuto, setLoadingGetCenterAuto] = useState<boolean>(false);
  const [getCenterAutoFlg, setGetCenterAutoFlg] = useState<boolean>(false);
  const [qList, setQList] = useState<number[]>();
  const [qListForGraph, setQListForGraph] = useState<number[]>();
  const [loadingCalibration, setLoadingCalibration] = useState<boolean>(false);
  const [calibrationFlg, setCalibrationFlg] = useState<boolean>(false);
  const [correctionFlg, setCorrectionFlg] = useState<boolean>(false);

  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [circularIList, setCircularIList] = useState<number[]>();
  const [circularGraphDatasets, setCircularGraphDatasets] = useState<GraphDataPoint[]>();
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [sectorIList, setSectorIList] = useState<number[]>();
  const [sectorGraphDatasets, setSectorGraphDatasets] = useState<GraphDataPoint[]>();
  const [sectorImageData, setSectorImageData] = useState<string>();
  const [angleRangeList, setAngleRangeList] = useState<Data[]>([{ min: 0, max: 0 }]);
  const [angleRangeListString, setAngleRangeListString] = useState<string>();
  const [horizontalIList, setHorizontalIList] = useState<number[]>();
  const [horizontalGraphDatasets, setHorizontalGraphDatasets] = useState<GraphDataPoint[]>();
  const [horizontalImageData, setHorizontalImageData] = useState<string>();
  const [verticalIList, setVerticalIList] = useState<number[]>();
  const [verticalGraphDatasets, setVerticalGraphDatasets] = useState<GraphDataPoint[]>();
  const [verticalImageData, setVerticalImageData] = useState<string>();

  let tooltipTimer: NodeJS.Timeout | undefined;

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseError = () => {
    setShowInfo(null);
  };

  const getImage = (imageType: 'standard' | 'background' | 'sample') => {
    let selectedFile: File | undefined = selectedStandardFile;
    let rangeForm: number[] = standardImageRangeForm;
    let setImageData: (imageData: string) => void = setStandardImageData;
    switch (imageType) {
      case 'standard':
        selectedFile = selectedStandardFile;
        rangeForm = standardImageRangeForm;
        setImageData = setStandardImageData;
        break;
      case 'background':
        selectedFile = selectedBackgroundFile;
        rangeForm = backgroundImageRangeForm;
        setImageData = setBackgroundImageData;
        break;
      case 'sample':
        selectedFile = selectedSampleFile;
        rangeForm = sampleImageRangeForm;
        setImageData = setSampleImageData;
        break;
    }
    if (selectedFile) {
      console.log('imageを取得します');
      const formData = new FormData();
      formData.append('tif', selectedFile);
      formData.append('vmin', String(Math.floor(10 ** rangeForm[0])));
      formData.append('vmax', String(Math.floor(10 ** rangeForm[1])));
      if (centerFlg) {
        formData.append('x_c', String(centerX));
        formData.append('y_c', String(centerY));
      }
      fetch(`${Url}image/get_image`, {
        method: 'POST',
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          const base64ImageData: string = data.image_data;
          setImageData(base64ImageData);
        })
        .catch((error) => {
          console.error(error);
        });
    } else if (initialRender) {
      console.log('初回レンダリングです');
      setInitialRender(false);
      return;
    } else {
      console.log(selectedFile);
      // setShowInfo(`${imageType}ファイルが入力されていません`);
      // setOpen(true);
    }
  };

  const getCenterAuto = () => {
    if (selectedStandardFile === undefined) {
      setShowInfo('standardファイルを入力してください');
      handleOpen();
      return;
    }
    if (selectedStandardFile) {
      setLoadingGetCenterAuto(true);
      // console.log('fileを送信します');
      const formData = new FormData();
      formData.append('tif', selectedStandardFile);
      formData.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });
      fetch(`${Url}image/get_center_auto`, {
        method: 'POST',
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          setCenterX(data.x_c);
          setCenterY(data.y_c);
          setGetCenterAutoFlg(true);
          setShowInfo('自動検出が完了しました');
        })
        .catch((error) => {
          console.error(error);
          setShowInfo(`エラー：${error}`);
        })
        .finally(() => {
          setLoadingGetCenterAuto(false);
        });
    }
  };

  const handleCalibration = () => {
    if (selectedStandardFile === undefined) {
      setShowInfo('standardファイルを入力してください');
      handleOpen();
      return;
    }
    if (!centerFlg) {
      setShowInfo('中心座標を決めてください');
      return;
    }
    if (loadingCalibration) {
      return;
    }
    setLoadingCalibration(true);
    const formData = new FormData();
    formData.append('tif', selectedStandardFile);
    formData.append('x_c', String(centerX));
    formData.append('y_c', String(centerY));
    fetch(`${Url}image/calibration`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        setQList(data.q_list);
        console.log(data.q_list);
        setCalibrationFlg(true);
        setShowInfo('キャリブレーションが完了しました');
      })
      .catch((error) => {
        console.error(error);
        setShowInfo(`エラー：${error}`);
      })
      .finally(() => {
        setLoadingCalibration(false);
      });
  };

  const handleCorrection = () => {
    if (selectedBackgroundFile === undefined || selectedSampleFile === undefined) {
      setShowInfo('backgroundファイルとsampleファイルを両方入れてください');
      setOpen(true);
      return;
    }
    if (correctionFlg) {
      setShowInfo('既にcorrection済みです');
      setOpen(true);
      return;
    }
    console.log('imageを取得します');
    const formData = new FormData();
    formData.append('tif', selectedSampleFile);
    formData.append('vmin', String(Math.floor(10 ** sampleImageRangeForm[0])));
    formData.append('vmax', String(Math.floor(10 ** sampleImageRangeForm[1])));
    formData.append('tif_background', selectedBackgroundFile);
    if (centerFlg) {
      formData.append('x_c', String(centerX));
      formData.append('y_c', String(centerY));
    }
    fetch(`${Url}image/get_image`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        const base64ImageData: string = data.image_data;
        setSampleImageData(base64ImageData);
        setCorrectionFlg(true);
        setShowInfo('correction完了しました');
        setOpen(true);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleDownloadCalibratonResult = () => {
    if (qList) {
      const csvData = generateCSV(qList);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'q_list.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleScanCircular = () => {
    if (selectedSampleFile === undefined) {
      setShowInfo('sampleファイルを入れてください');
      setOpen(true);
      return;
    }
    console.log('円環平均をとります');
    const formData = new FormData();
    formData.append('tif', selectedSampleFile);
    formData.append('vmin', String(Math.floor(10 ** sampleImageRangeForm[0])));
    formData.append('vmax', String(Math.floor(10 ** sampleImageRangeForm[1])));
    if (selectedBackgroundFile) {
      formData.append('tif_background', selectedBackgroundFile);
    }
    formData.append('x_c', String(centerX));
    formData.append('y_c', String(centerY));
    fetch(`${Url}image/scan_circular`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        const iListTmp: number[] = data.I_list;
        setCircularIList(iListTmp);
        if (qList) {
          setQListForGraph(qList.slice(0, data.I_list.length));
        }
        setShowInfo('円環平均完了しました');
        setOpen(true);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleScanSector = () => {
    if (selectedSampleFile === undefined) {
      setShowInfo('sampleファイルを入れてください');
      setOpen(true);
      return;
    }
    console.log('セクター平均をとります');
    const formData = new FormData();
    formData.append('tif', selectedSampleFile);
    formData.append('vmin', String(Math.floor(10 ** sampleImageRangeForm[0])));
    formData.append('vmax', String(Math.floor(10 ** sampleImageRangeForm[1])));
    if (selectedBackgroundFile) {
      formData.append('tif_background', selectedBackgroundFile);
    }
    formData.append('x_c', String(centerX));
    formData.append('y_c', String(centerY));
    if (angleRangeListString === undefined) {
      setShowInfo('角度が入力されていません');
      setOpen(true);
      return;
    }
    formData.append('angle_range_list', angleRangeListString);
    fetch(`${Url}image/scan_sector`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        const iListTmp: number[] = data.I_list;
        setSectorIList(iListTmp);
        setSectorImageData(data.image_data);
        setShowInfo('セクター平均完了しました');
        setOpen(true);
        console.log(data.I_list);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleScanHorizontal = () => {
    if (selectedSampleFile === undefined) {
      setShowInfo('sampleファイルを入れてください');
      setOpen(true);
      return;
    }
    console.log('水平スキャンをとります');
    const formData = new FormData();
    formData.append('tif', selectedSampleFile);
    formData.append('vmin', String(Math.floor(10 ** sampleImageRangeForm[0])));
    formData.append('vmax', String(Math.floor(10 ** sampleImageRangeForm[1])));
    if (selectedBackgroundFile) {
      formData.append('tif_background', selectedBackgroundFile);
    }
    formData.append('x_c', String(centerX));
    formData.append('y_c', String(centerY));
    fetch(`${Url}image/scan_horizontal`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        const iListTmp: number[] = data.I_list;
        setHorizontalIList(iListTmp);
        setHorizontalImageData(data.image_data);
        setShowInfo('水平スキャン完了しました');
        setOpen(true);
        console.log(data.I_list);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleScanVertical = () => {
    if (selectedSampleFile === undefined) {
      setShowInfo('sampleファイルを入れてください');
      setOpen(true);
      return;
    }
    console.log('垂直スキャンをとります');
    const formData = new FormData();
    formData.append('tif', selectedSampleFile);
    formData.append('vmin', String(Math.floor(10 ** sampleImageRangeForm[0])));
    formData.append('vmax', String(Math.floor(10 ** sampleImageRangeForm[1])));
    if (selectedBackgroundFile) {
      formData.append('tif_background', selectedBackgroundFile);
    }
    formData.append('x_c', String(centerX));
    formData.append('y_c', String(centerY));
    fetch(`${Url}image/scan_vertical`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        const iListTmp: number[] = data.I_list;
        setVerticalIList(iListTmp);
        setVerticalImageData(data.image_data);
        setShowInfo('垂直スキャン完了しました');
        setOpen(true);
        console.log(data.I_list);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    if (showInfo !== null) {
      handleOpen();
    }
  }, [showInfo]);

  useEffect(() => {
    getImage('standard');
  }, [selectedStandardFile, standardImageRangeForm, centerFlg, centerX, centerY]);

  useEffect(() => {
    getImage('background');
  }, [selectedBackgroundFile, backgroundImageRangeForm]);

  useEffect(() => {
    getImage('sample');
  }, [selectedSampleFile, sampleImageRangeForm, centerX, centerY]);

  useEffect(() => {
    if (qList !== undefined && circularIList !== undefined) {
      const graphDataPoints: GraphDataPoint[] = circularIList?.map((y, index) => ({ x: qList[index], y: y }));
      setCircularGraphDatasets(graphDataPoints.slice(1));
      // setCircularGraphDatasets(data);
    }
  }, [circularIList]);

  useEffect(() => {
    if (qList !== undefined && sectorIList !== undefined) {
      const graphDataPoints: GraphDataPoint[] = sectorIList?.map((y, index) => ({ x: qList[index], y: y }));
      setSectorGraphDatasets(graphDataPoints.slice(1));
    }
  }, [sectorIList]);

  useEffect(() => {
    console.log(horizontalIList);
    if (horizontalIList !== undefined) {
      const graphDataPoints: GraphDataPoint[] = horizontalIList?.map((y, index) => ({ x: index, y: y }));
      setHorizontalGraphDatasets(graphDataPoints.slice(1));
    }
  }, [horizontalIList]);

  useEffect(() => {
    if (verticalIList !== undefined) {
      const graphDataPoints: GraphDataPoint[] = verticalIList?.map((y, index) => ({ x: index, y: y }));
      setVerticalGraphDatasets(graphDataPoints.slice(1));
    }
  }, [verticalIList]);

  useEffect(() => {
    setAngleRangeListString(JSON.stringify(angleRangeList.map(({ min, max }) => [min, max])));
    console.log(JSON.stringify(angleRangeList.map(({ min, max }) => [min, max])));
  }, [angleRangeList]);

  const handleStandardFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCenterFlg(false);
    setSelectedStandardFile(event.target.files?.[0]);
  };

  const handleStandardRangeChange = (event: Event, newValue: number | number[]) => {
    setStandardImageRange(newValue as number[]);
  };

  const handleStandardRangeClick = () => {
    setStandardImageRangeForm(standardImageRange);
  };

  const handleCenterXChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value: number = parseInt(event.target.value, 10);
    setCenterX(value);
  };

  const handleCenterYChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value: number = parseInt(event.target.value, 10);
    setCenterY(value);
  };

  const handleClickCenterButton = () => {
    setCenterFlg(true);
  };

  const handleClickCenterAutoInputButton = () => {
    getCenterAuto();
  };

  const handleBackgroundFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedBackgroundFile(event.target.files?.[0]);
  };

  const handleBackgroundRangeChange = (event: Event, newValue: number | number[]) => {
    setBackgroundImageRange(newValue as number[]);
  };

  const handleBackgroundRangeClick = () => {
    setBackgroundImageRangeForm(backgroundImageRange);
  };

  const handleSampleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSampleFile(event.target.files?.[0]);
  };

  const handleSampleRangeChange = (event: Event, newValue: number | number[]) => {
    setSampleImageRange(newValue as number[]);
  };

  const handleSampleRangeClick = () => {
    setSampleImageRangeForm(sampleImageRange);
  };

  const handleCorrectionBack = () => {
    getImage('sample');
    setCorrectionFlg(false);
  };

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleAddData = () => {
    setAngleRangeList([...angleRangeList, { min: 0, max: 0 }]);
  };

  const handleRemoveData = (index: number) => {
    const updatedangleRangeList = [...angleRangeList];
    updatedangleRangeList.splice(index, 1);
    setAngleRangeList(updatedangleRangeList);
  };

  const handleInputChange = (index: number, field: 'min' | 'max', value: number) => {
    const updatedangleRangeList = [...angleRangeList];
    updatedangleRangeList[index][field] = value;
    setAngleRangeList(updatedangleRangeList);
  };

  const handleDownloadScanCircularResult = () => {
    if (circularGraphDatasets) {
      const csv = graphDataPointToCSV(circularGraphDatasets);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scan_circular_result.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const handleDownloadScanSectorResult = () => {
    if (sectorGraphDatasets) {
      const csv = graphDataPointToCSV(sectorGraphDatasets);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scan_sector_result.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const data: GraphDataPoint[] = [];

  return (
    <div className="App">
      <header className="App-header" style={{ minWidth: '1200px' }}>
        <Typography variant="h1" style={{ margin: '0 0 30px 0' }}>
          hoge
        </Typography>
        <Container>
          <Grid container spacing={2}>
            <Grid item xs={4} sm={4}>
              <Typography variant="h4" gutterBottom>
                標準サンプル
              </Typography>
              <Box style={{ margin: '30px 0' }}>
                <input id="standard-file-input" type="file" accept=".tif" style={{ display: 'none' }} onChange={handleStandardFileChange} />
                <label htmlFor="standard-file-input">
                  <Button variant="contained" color="primary" component="span" startIcon={<CloudUploadIcon />}>
                    ファイルを選択
                  </Button>
                </label>
                {selectedStandardFile && <p>{selectedStandardFile.name}</p>}
              </Box>
              {standardImageData && <img src={`data:image/png;base64,${standardImageData}`} />}
              <Box display="flex" justifyContent="center" style={{ margin: '50px 0' }}>
                <WhiteMarksSlider
                  value={standardImageRange}
                  getAriaLabel={(index) => (index === 0 ? 'Minimum' : 'Maximum')}
                  min={0}
                  max={10}
                  step={0.1}
                  onChange={handleStandardRangeChange}
                  valueLabelDisplay="auto"
                  valueLabelFormat={calculateValue}
                  marks={marks}
                  onClick={handleStandardRangeClick}
                  sx={{
                    width: 300,
                  }}
                />
              </Box>
              {centerFlg ? (
                <div>
                  <Typography variant="h4" gutterBottom>
                    事前処理
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <WhiteFontTextField label="CenterX" variant="outlined" type="number" value={centerX} onChange={handleCenterXChange} />
                    </Grid>
                    <Grid item xs={6}>
                      <WhiteFontTextField label="CenterY" variant="outlined" type="number" value={centerY} onChange={handleCenterYChange} />
                    </Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button variant="contained" onClick={handleClickCenterAutoInputButton} style={{ margin: '20px 5px' }}>
                        {loadingGetCenterAuto ? (
                          <CircularProgress color="inherit" size={24} /> // ローディング中はCircularProgress
                        ) : getCenterAutoFlg ? (
                          <CheckCircleIcon /> // GetCenterAutoFlgがtrueの場合はCheckCircleIcon
                        ) : (
                          <PlayArrowIcon /> // 上記以外の場合はPlayArrowIcon
                        )}
                        自動検出
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button variant="contained" onClick={handleCalibration} style={{ margin: '20px 5px' }} disabled={loadingCalibration}>
                        {loadingCalibration ? (
                          <CircularProgress color="inherit" size={24} /> // ローディング中はCircularProgress
                        ) : calibrationFlg ? (
                          <CheckCircleIcon /> // calibrationFlgがtrueの場合はCheckCircleIcon
                        ) : (
                          <PlayArrowIcon /> // 上記以外の場合はPlayArrowIcon
                        )}
                        Calibration
                      </Button>
                      <Button variant="contained" onClick={handleDownloadCalibratonResult} style={{ margin: '5px 5px' }} disabled={!calibrationFlg}>
                        <CloudDownloadIcon />
                        csv出力
                      </Button>
                    </Grid>
                  </Grid>
                </div>
              ) : (
                <Button variant="contained" onClick={handleClickCenterButton}>
                  中心入力・キャリブレーション
                </Button>
              )}
            </Grid>

            <Grid item xs={4} sm={4}>
              <Typography variant="h4" gutterBottom>
                バックグラウンド
              </Typography>
              <Box style={{ margin: '30px 0' }}>
                <input id="background-file-input" type="file" accept=".tif" style={{ display: 'none' }} onChange={handleBackgroundFileChange} />
                <label htmlFor="background-file-input">
                  <Button variant="contained" color="primary" component="span" startIcon={<CloudUploadIcon />}>
                    ファイルを選択
                  </Button>
                </label>
                {selectedBackgroundFile && <p>{selectedBackgroundFile.name}</p>}
              </Box>
              {backgroundImageData && <img src={`data:image/png;base64,${backgroundImageData}`} />}
              <Box display="flex" justifyContent="center" style={{ margin: '50px 0' }}>
                <WhiteMarksSlider
                  value={backgroundImageRange}
                  getAriaLabel={(index) => (index === 0 ? 'Minimum' : 'Maximum')}
                  min={0}
                  max={10}
                  step={0.1}
                  onChange={handleBackgroundRangeChange}
                  valueLabelDisplay="auto"
                  valueLabelFormat={calculateValue}
                  marks={marks}
                  onClick={handleBackgroundRangeClick}
                  sx={{ width: 300 }}
                />
              </Box>
            </Grid>

            <Grid item xs={4} sm={4}>
              <Typography variant="h4" gutterBottom>
                サンプル
              </Typography>
              <Box style={{ margin: '30px 0' }}>
                <input id="sample-file-input" type="file" accept=".tif" style={{ display: 'none' }} onChange={handleSampleFileChange} />
                <label htmlFor="sample-file-input">
                  <Button variant="contained" color="primary" component="span" startIcon={<CloudUploadIcon />}>
                    ファイルを選択
                  </Button>
                </label>
                {selectedSampleFile && <p>{selectedSampleFile.name}</p>}
              </Box>
              {sampleImageData && <img src={`data:image/png;base64,${sampleImageData}`} />}
              <Box display="flex" justifyContent="center" style={{ margin: '50px 0' }}>
                <WhiteMarksSlider
                  value={sampleImageRange}
                  getAriaLabel={(index) => (index === 0 ? 'Minimum' : 'Maximum')}
                  min={0}
                  max={10}
                  step={0.1}
                  onChange={handleSampleRangeChange}
                  valueLabelDisplay="auto"
                  valueLabelFormat={calculateValue}
                  marks={marks}
                  onClick={handleSampleRangeClick}
                  sx={{ width: 300 }}
                />
              </Box>
              <Button variant="contained" disabled={correctionFlg} onClick={handleCorrection}>
                correction
              </Button>
              <Button variant="contained" disabled={!correctionFlg} onClick={handleCorrectionBack}>
                元に戻す
              </Button>
            </Grid>
          </Grid>
        </Container>
        <Box
          sx={{
            width: 1100,
            minWidth: 500,
            minHeight: 800,
            borderColor: 'lightgray',
            borderStyle: 'solid',
            borderWidth: 2,
            margin: '50px 0',
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            style={{ width: tabWidth * 4 }}
            sx={{
              alignSelf: 'flex-start', // タブを左上に配置
              justifyContent: 'flex-start', // タブを左寄せ
            }}
          >
            <Tab
              label="円環"
              style={{ width: tabWidth, color: 'white' }}
              sx={{
                borderColor: 'lightgray',
                borderStyle: 'solid',
                borderWidth: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', // 選択時の背景色を薄い白に設定
                  color: 'white', // 選択時のテキストの色を白に設定
                },
              }}
            />
            <Tab
              label="セクター"
              style={{ width: tabWidth, color: 'white' }}
              sx={{
                borderColor: 'lightgray',
                borderStyle: 'solid',
                borderWidth: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', // 選択時の背景色を薄い白に設定
                  color: 'white', // 選択時のテキストの色を白に設定
                },
              }}
            />
            <Tab
              label="水平"
              style={{ width: tabWidth, color: 'white' }}
              sx={{
                borderColor: 'lightgray',
                borderStyle: 'solid',
                borderWidth: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', // 選択時の背景色を薄い白に設定
                  color: 'white', // 選択時のテキストの色を白に設定
                },
              }}
            />
            <Tab
              label="垂直"
              style={{ width: tabWidth, color: 'white' }}
              sx={{
                borderColor: 'lightgray',
                borderStyle: 'solid',
                borderWidth: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', // 選択時の背景色を薄い白に設定
                  color: 'white', // 選択時のテキストの色を白に設定
                },
              }}
            />
          </Tabs>
          {selectedTab === 0 && (
            <Container sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box display="flex" alignItems="center" justifyContent="center" sx={{ minHeight: 800, width: 400, flexDirection: 'column' }}>
                    <Box>
                      <Typography variant="h6" style={{ margin: '5px 5px' }}>
                        中心座標: ({centerX}, {centerY})
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6" style={{ margin: '5px 5px' }}>
                        Calibration: ({calibrationFlg ? '完了' : '未完了'})
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6" style={{ margin: '5px 5px' }}>
                        Correction: ({correctionFlg ? '完了' : '未完了'})
                      </Typography>
                    </Box>
                    <Box>
                      <Button variant="contained" onClick={handleScanCircular} style={{ margin: '5px 5px' }}>
                        円環平均
                      </Button>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box display="flex" alignItems="center" justifyContent="center" sx={{ minHeight: 800, width: 400 }}>
                    {qList !== undefined && circularIList !== undefined ? (
                      <div>
                        <LineChart width={500} height={600} data={circularGraphDatasets}>
                          <CartesianGrid strokeDasharray="3 3" />{' '}
                          <XAxis
                            dataKey="x"
                            type="number"
                            scale="log"
                            tick={{ fontSize: 12, fill: 'white' }}
                            domain={[0.0001, 1]}
                            ticks={[0.0001, 0.001, 0.01, 1]}
                            tickFormatter={(value) => `${formatNumberInExponential(Number(value), 2)}`}
                          />
                          <YAxis
                            dataKey="y"
                            type="number"
                            scale="log"
                            domain={[1, 10000]}
                            ticks={[1, 10, 100, 1000, 10000]}
                            tick={{ fontSize: 12, fill: 'white' }}
                            tickFormatter={(value) => `${formatNumberInExponential(Number(value), 2)}`}
                          />
                          <Tooltip
                            formatter={(value, name, props) => {
                              if (props) {
                                const xValue = props.payload.x; // 横軸の値
                                const yValue = value; // 縦軸の値
                                return [`x: ${formatNumberInExponential(Number(xValue), 2)}\ny: ${formatNumberInExponential(Number(yValue), 2)}`];
                              }
                              return [];
                            }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="y" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                        <Button variant="contained" onClick={handleDownloadScanCircularResult} style={{ margin: '5px 5px' }} disabled={!calibrationFlg} startIcon={<CloudDownloadIcon />}>
                          csv出力
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <LineChart width={500} height={600} data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="x"
                            type="number"
                            scale="log"
                            tick={{ fontSize: 12, fill: 'white' }}
                            domain={[1, 4]}
                            ticks={[0.0001, 0.001, 0.01, 1, 10]}
                            tickFormatter={(value) => `${formatNumberInExponential(Number(value), 2)}`} // 指数表示に変換
                            // name={{ value: 'q (Å⁻¹)', position: 'bottom', dy: 30, fill: 'white' }}
                          />
                          <YAxis
                            dataKey="y"
                            type="number"
                            scale="log"
                            domain={[0.1, 100000]}
                            tick={{ fontSize: 12, fill: 'white' }}
                            tickFormatter={(value) => `${formatNumberInExponential(Number(value), 2)}`} // 指数表示に変換
                          />
                          <Tooltip
                            formatter={(value, name, props, payload) => {
                              if (props) {
                                const xValue = props.payload.x; // 横軸の値
                                const yValue = value; // 縦軸の値
                                return [`x: ${formatNumberInExponential(Number(xValue), 2)}\ny: ${formatNumberInExponential(Number(yValue), 2)}`];
                              }
                              return [];
                            }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="y" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                      </div>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Container>
          )}
          {selectedTab === 1 && (
            <Container sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box display="flex" alignItems="center" justifyContent="center" sx={{ minHeight: 800, width: 400, flexDirection: 'column' }}>
                    <Box>
                      <Typography variant="h6" style={{ margin: '5px 5px' }}>
                        中心座標: ({centerX}, {centerY})
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6" style={{ margin: '5px 5px' }}>
                        Calibration: ({calibrationFlg ? '完了' : '未完了'})
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6" style={{ margin: '5px 5px' }}>
                        Correction: ({correctionFlg ? '完了' : '未完了'})
                      </Typography>
                    </Box>
                    <Box>
                      <Button variant="contained" onClick={handleScanSector} style={{ margin: '5px 5px' }}>
                        セクター平均
                      </Button>
                    </Box>
                    {sectorImageData && <img src={`data:image/png;base64,${sectorImageData}`} />}
                    <List>
                      {angleRangeList.map((data, index) => (
                        <ListItem key={index} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          角度{index + 1}：
                          <WhiteFontTextField
                            sx={{ width: '80px', height: '50px' }}
                            type="number"
                            value={data.min}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(index, 'min', Number(e.target.value))}
                          />
                          ～
                          <WhiteFontTextField
                            sx={{ width: '80px', height: '50px' }}
                            type="number"
                            value={data.max}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(index, 'max', Number(e.target.value))}
                          />
                          <IconButton onClick={() => handleRemoveData(index)} aria-label="delete">
                            <DeleteIcon style={{ color: 'white' }} />
                          </IconButton>
                        </ListItem>
                      ))}
                      <Button variant="contained" onClick={handleAddData} startIcon={<AddIcon />} style={{ margin: '20px' }}>
                        追加
                      </Button>
                    </List>
                  </Box>
                </Grid>
                <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box display="flex" alignItems="center" justifyContent="center" sx={{ minHeight: 800, width: 400 }}>
                    {qList !== undefined && circularIList !== undefined ? (
                      <div>
                        <LineChart width={500} height={600} data={sectorGraphDatasets}>
                          <CartesianGrid strokeDasharray="3 3" />{' '}
                          <XAxis
                            dataKey="x"
                            type="number"
                            scale="log"
                            tick={{ fontSize: 12, fill: 'white' }}
                            domain={[0.0001, 1]}
                            ticks={[0.0001, 0.001, 0.01, 1]}
                            tickFormatter={(value) => `${formatNumberInExponential(Number(value), 2)}`}
                          />
                          <YAxis
                            dataKey="y"
                            type="number"
                            scale="log"
                            domain={[1, 10000]}
                            ticks={[1, 10, 100, 1000, 10000]}
                            tick={{ fontSize: 12, fill: 'white' }}
                            tickFormatter={(value) => `${formatNumberInExponential(Number(value), 2)}`}
                          />
                          <Tooltip
                            formatter={(value, name, props) => {
                              if (props) {
                                const xValue = props.payload.x; // 横軸の値
                                const yValue = value; // 縦軸の値
                                return [`x: ${formatNumberInExponential(Number(xValue), 2)}\ny: ${formatNumberInExponential(Number(yValue), 2)}`];
                              }
                              return [];
                            }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="y" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                        <Button variant="contained" onClick={handleDownloadScanSectorResult} style={{ margin: '5px 5px' }} disabled={!calibrationFlg} startIcon={<CloudDownloadIcon />}>
                          csv出力
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <LineChart width={500} height={600} data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="x"
                            type="number"
                            scale="log"
                            tick={{ fontSize: 12, fill: 'white' }}
                            domain={[1, 4]}
                            ticks={[0.0001, 0.001, 0.01, 1, 10]}
                            tickFormatter={(value) => `${formatNumberInExponential(Number(value), 2)}`} // 指数表示に変換
                            // name={{ value: 'q (Å⁻¹)', position: 'bottom', dy: 30, fill: 'white' }}
                          />
                          <YAxis
                            dataKey="y"
                            type="number"
                            scale="log"
                            domain={[0.1, 100000]}
                            tick={{ fontSize: 12, fill: 'white' }}
                            tickFormatter={(value) => `${formatNumberInExponential(Number(value), 2)}`} // 指数表示に変換
                          />
                          <Tooltip
                            formatter={(value, name, props, payload) => {
                              if (props) {
                                const xValue = props.payload.x; // 横軸の値
                                const yValue = value; // 縦軸の値
                                return [`x: ${formatNumberInExponential(Number(xValue), 2)}\ny: ${formatNumberInExponential(Number(yValue), 2)}`];
                              }
                              return [];
                            }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="y" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                      </div>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Container>
          )}
          {selectedTab === 2 && (
            <Container sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box display="flex" alignItems="center" justifyContent="center" sx={{ minHeight: 800, width: 400, flexDirection: 'column' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <WhiteFontTextField label="CenterX" variant="outlined" type="number" value={centerX} onChange={handleCenterXChange} />
                      </Grid>
                      <Grid item xs={6}>
                        <WhiteFontTextField label="CenterY" variant="outlined" type="number" value={centerY} onChange={handleCenterYChange} />
                      </Grid>
                    </Grid>
                    <Box>
                      <Button variant="contained" onClick={handleScanHorizontal} style={{ margin: '10px' }}>
                        水平スキャン
                      </Button>
                    </Box>
                    {horizontalImageData && <img src={`data:image/png;base64,${horizontalImageData}`} />}
                  </Box>
                </Grid>
                <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box display="flex" alignItems="center" justifyContent="center" sx={{ minHeight: 800, width: 400 }}>
                    {horizontalIList !== undefined ? (
                      <div>
                        <LineChart width={500} height={600} data={horizontalGraphDatasets}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="x" scale="linear" type="number" tick={{ fontSize: 12, fill: 'white' }} domain={[0, 1000]} />
                          <YAxis
                            dataKey="y"
                            type="number"
                            scale="log"
                            domain={[1, 10000]}
                            ticks={[1, 10, 100, 1000, 10000]}
                            tick={{ fontSize: 12, fill: 'white' }}
                            tickFormatter={(value) => `${formatNumberInExponential(Number(value), 2)}`}
                          />
                          <Tooltip
                            formatter={(value, name, props) => {
                              if (props) {
                                const xValue = props.payload.x; // 横軸の値
                                const yValue = value; // 縦軸の値
                                return [`x: ${Number(xValue)}\ny: ${formatNumberInExponential(Number(yValue), 2)}`];
                              }
                              return [];
                            }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="y" stroke="#8884d8" activeDot={{ r: 4 }} dot={{ r: 1 }} />
                        </LineChart>
                        <Button variant="contained" onClick={handleDownloadScanCircularResult} style={{ margin: '5px 5px' }} disabled={!calibrationFlg} startIcon={<CloudDownloadIcon />}>
                          csv出力
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <LineChart width={500} height={600} data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="x"
                            type="number"
                            scale="log"
                            tick={{ fontSize: 12, fill: 'white' }}
                            domain={[1, 4]}
                            ticks={[0.0001, 0.001, 0.01, 1, 10]}
                            tickFormatter={(value) => `${formatNumberInExponential(Number(value), 2)}`} // 指数表示に変換
                            // name={{ value: 'q (Å⁻¹)', position: 'bottom', dy: 30, fill: 'white' }}
                          />
                          <YAxis
                            dataKey="y"
                            type="number"
                            scale="log"
                            domain={[0.1, 100000]}
                            tick={{ fontSize: 12, fill: 'white' }}
                            tickFormatter={(value) => `${formatNumberInExponential(Number(value), 2)}`} // 指数表示に変換
                          />
                          <Tooltip
                            formatter={(value, name, props, payload) => {
                              if (props) {
                                const xValue = props.payload.x; // 横軸の値
                                const yValue = value; // 縦軸の値
                                return [`x: ${formatNumberInExponential(Number(xValue), 2)}\ny: ${formatNumberInExponential(Number(yValue), 2)}`];
                              }
                              return [];
                            }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="y" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                      </div>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Container>
          )}
          {selectedTab === 3 && (
            <Container sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box display="flex" alignItems="center" justifyContent="center" sx={{ minHeight: 800, width: 400, flexDirection: 'column' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <WhiteFontTextField label="CenterX" variant="outlined" type="number" value={centerX} onChange={handleCenterXChange} />
                      </Grid>
                      <Grid item xs={6}>
                        <WhiteFontTextField label="CenterY" variant="outlined" type="number" value={centerY} onChange={handleCenterYChange} />
                      </Grid>
                    </Grid>
                    <Box>
                      <Button variant="contained" onClick={handleScanVertical} style={{ margin: '10px' }}>
                        垂直スキャン
                      </Button>
                    </Box>
                    {verticalImageData && <img src={`data:image/png;base64,${verticalImageData}`} />}
                  </Box>
                </Grid>
                <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box display="flex" alignItems="center" justifyContent="center" sx={{ minHeight: 800, width: 400 }}>
                    {verticalIList !== undefined ? (
                      <div>
                        <LineChart width={500} height={600} data={verticalGraphDatasets}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="x" scale="linear" type="number" tick={{ fontSize: 12, fill: 'white' }} domain={[0, 1000]} />
                          <YAxis
                            dataKey="y"
                            type="number"
                            scale="log"
                            domain={[1, 10000]}
                            ticks={[1, 10, 100, 1000, 10000]}
                            tick={{ fontSize: 12, fill: 'white' }}
                            tickFormatter={(value) => `${formatNumberInExponential(Number(value), 2)}`}
                          />
                          <Tooltip
                            formatter={(value, name, props) => {
                              if (props) {
                                const xValue = props.payload.x; // 横軸の値
                                const yValue = value; // 縦軸の値
                                return [`x: ${Number(xValue)}\ny: ${formatNumberInExponential(Number(yValue), 2)}`];
                              }
                              return [];
                            }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="y" stroke="#8884d8" activeDot={{ r: 4 }} dot={{ r: 1 }} />
                        </LineChart>
                        <Button variant="contained" onClick={handleDownloadScanCircularResult} style={{ margin: '5px 5px' }} disabled={!calibrationFlg} startIcon={<CloudDownloadIcon />}>
                          csv出力
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <LineChart width={500} height={600} data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="x"
                            type="number"
                            scale="log"
                            tick={{ fontSize: 12, fill: 'white' }}
                            domain={[1, 4]}
                            ticks={[0.0001, 0.001, 0.01, 1, 10]}
                            tickFormatter={(value) => `${formatNumberInExponential(Number(value), 2)}`} // 指数表示に変換
                            // name={{ value: 'q (Å⁻¹)', position: 'bottom', dy: 30, fill: 'white' }}
                          />
                          <YAxis
                            dataKey="y"
                            type="number"
                            scale="log"
                            domain={[0.1, 100000]}
                            tick={{ fontSize: 12, fill: 'white' }}
                            tickFormatter={(value) => `${formatNumberInExponential(Number(value), 2)}`} // 指数表示に変換
                          />
                          <Tooltip
                            formatter={(value, name, props, payload) => {
                              if (props) {
                                const xValue = props.payload.x; // 横軸の値
                                const yValue = value; // 縦軸の値
                                return [`x: ${formatNumberInExponential(Number(xValue), 2)}\ny: ${formatNumberInExponential(Number(yValue), 2)}`];
                              }
                              return [];
                            }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="y" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                      </div>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Container>
          )}
        </Box>
      </header>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Alert</DialogTitle>
        <DialogContent>
          <DialogContentText>{showInfo}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={open} onClick={handleClose}></Backdrop>
    </div>
  );
};

export default App;
