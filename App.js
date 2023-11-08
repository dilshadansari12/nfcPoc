import React from 'react';
import { View, Text, StyleSheet, Button, ToastAndroid, TextInput } from 'react-native';
import NfcManager, {
  NfcTech,
  Ndef,
  NfcEvents,
  NfcError,
} from 'react-native-nfc-manager';

// Pre-step, call this before any NFC operations
NfcManager.start();


function App() {
  const [isWritemood, setiswritemood] = React.useState(false);
  const [isReadmood, setisReadmood] = React.useState(false);
  const [text, onChangeText] = React.useState("");

  // for write 
  const writeNdef = async () => {
    console.log("in");
    if (isWritemood) {
      if (!text) return;
      console.log("start");
      const value = text;
      await NfcProxyWriteNdef({ type: 'TEXT', value });
    }
  };

  const NfcProxyWriteNdef = async ({ type, value }) => {
    console.log("NfcProxyWriteNdef", type, value);
    let result = false;

    try {
      console.log("tryin");
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Ready to write some NDEF',
      });

      let bytes = null;
      if (type === 'TEXT') {
        console.log("text");
        bytes = Ndef.encodeMessage([Ndef.textRecord(value)]);
      }

      if (bytes) {
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        if (Platform.OS === 'ios') {
          await NfcManager.setAlertMessageIOS('Success');
        }
        result = true;
      }
      setiswritemood("");
      onChangeText("");

    } catch (ex) {
      console.log("fail try ", ex);
      handleException(ex);
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
    return result;
  };


  // for read



  return (
    <View style={styles.wrapper}>
      {
        isWritemood && (
          <View style={styles.overlay}>
            <TextInput
              style={styles.inputTag}
              placeholder='Enter Tag Details'
              onChangeText={onChangeText}
              value={text}
            />
            <Button title='go' style={{ color: "red" }} onPress={writeNdef} />
          </View>
        )
      }

      <View style={styles.buttonGroup}>
        <Button onPress={() => { setiswritemood(!isWritemood) }} title='Write Tag' />
        <Button onPress={() => { setisReadmood(!isReadmood) }} title='Read Tag' />
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'start',
    alignItems: 'center',
  },
  buttonGroup: {
    width: "100%",
    display: "flex",
    justifyContent: "space-evenly",
    marginTop: 200
  },
  overlay: {
    width: "100%",
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  inputTag: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    backgroundColor: "white"
  }
});

export default App;