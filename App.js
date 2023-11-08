import React from 'react';
import { View, Text, StyleSheet, Button, ToastAndroid, TextInput, ScrollView, Image } from 'react-native';
import { TouchableOpacity } from 'react-native';

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
  const [isScanMood, setisScanMood] = React.useState(false);
  const [text, onChangeText] = React.useState("");
  const [nfcTagData, setnfcTagData] = React.useState({ id: null, tagTech: null, text: null, tagObject: null });

  // for write 
  const writeNdef = async () => {
    setisScanMood(true)
    if (isWritemood) {
      if (!text) return;
      const value = text;
      await NfcProxyWriteNdef({ type: 'TEXT', value });
    }
  };

  const NfcProxyWriteNdef = async ({ type, value }) => {
    let result = false;
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Ready to write some NDEF',
      });

      let bytes = null;
      if (type === 'TEXT') {
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
      setisScanMood(false);
      ToastAndroid.show("success! writing completed", ToastAndroid.SHORT);
    } catch (ex) {
      console.log("fail try ", ex);
      handleException(ex);
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
    return result;
  };


  // for read

  const withAndroidPrompt = async () => {
    setisScanMood(true)
    let tag = null;

    try {
      await NfcManager.requestTechnology([NfcTech.Ndef]);
      tag = await NfcManager.getTag();
      tag.ndefStatus = await NfcManager.ndefHandler.getNdefStatus();

      if (Platform.OS === 'ios') {
        await NfcManager.setAlertMessageIOS('Success');
      }
    } catch (ex) {
      console.log("somthing is missing", ex);
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
    const tagId = tag?.id;
    const tagTech = tag?.techTypes;
    const ndef = Array.isArray(tag.ndefMessage) && tag.ndefMessage.length > 0 ? tag.ndefMessage[0] : null;
    let text = Ndef.util.bytesToString(ndef.payload);
    const tagObject = JSON.stringify(tag, null, 2);
    setnfcTagData({ id: tagId, tagTech, text, tagObject });
    setisScanMood(false);
  };


  return (
    <View style={styles.wrapper}>

      {/* for write */}
      {
        isWritemood && (
          <View style={styles.overlay}>
            {!isScanMood && <View style={styles.contentFotWriter}>
              <TextInput
                style={styles.inputTag}
                placeholder='Enter Text'
                onChangeText={onChangeText}
                value={text}
              />

              <TouchableOpacity onPress={writeNdef} style={{ backgroundColor: '#06bcee', padding: 10, width: 200, marginTop: 15 }}>
                <Text style={{ color: 'black', textAlign: 'center' }} onPress={writeNdef} >GO</Text>
              </TouchableOpacity>
            </View>
            }

            {/* scan your tag */}
            {
              isScanMood && <View style={styles.contentFotWriter}>
                <Image source={require('./nfctag.jpg')} height={2} width={2} style={styles.tagImg} />
                <Text style={{ textAlign: "center", marginTop: 20 }}>Scan Your Tag</Text>
              </View>
            }
          </View>
        )
      }

      {/* for read dialog */}
      {
        isScanMood && isReadmood && <View style={styles.overlay}>
          <View style={styles.contentFotWriter}>
            <Image source={require('./nfctag.jpg')} height={2} width={2} style={styles.tagImg} />
            <Text style={{ textAlign: "center", marginTop: 20 }}>Scan Your Tag</Text>
          </View>
        </View>
      }

      {
        nfcTagData?.id && isReadmood && (
          <ScrollView style={styles.tagDetails}>
            <View>
              <View>
                <Text>Id</Text>
                <Text>{nfcTagData?.id}</Text>
              </View>

              <View>
                <Text>Tag Tech</Text>
                <Text>{nfcTagData?.tagTech.map((r) => r)} </Text>
              </View>

              <View>
                <Text>Tag Text</Text>
                <Text style={{ fontSize: "bold", fontSize: 20 }}>{nfcTagData?.text}</Text>
              </View>

              <View>
                <Text>Tag Object</Text>
                <Text>{nfcTagData?.tagObject}</Text>
              </View>
            </View>
            <Button title='GO BACK' onPress={() => { setisReadmood(false), setnfcTagData({ id: null, tagTech: null, text: null, tagObject: null }) }} />
          </ScrollView>
        )
      }

      {!(isWritemood || isReadmood) && <View style={styles.buttonGroup}>
        <TouchableOpacity onPress={() => { setiswritemood(!isWritemood) }} style={{ borderWidth: 2, borderColor: "#06bcee", padding: 10, width: 200 }}>
          <Text style={{ color: 'black', textAlign: 'center' }}>Write Tag</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setisReadmood(true), withAndroidPrompt() }} style={{ backgroundColor: '#06bcee', padding: 10, width: 200 }}>
          <Text style={{ color: 'white', textAlign: 'center' }}> Read Tag</Text>
        </TouchableOpacity>
      </View>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: "relative"
  },
  buttonGroup: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 100
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#aebcc0b8",
    height: 300,
    display: "flex",
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20

  },
  contentFotWriter: {
    width: "90%",
    padding: 20,
    display: "flex",
    alignItems: "center",
  },
  tagImg: {
    width: 130,
    height: 130,
    borderRadius: 20,
  },

  inputTag: {
    width: 300,
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    backgroundColor: "white"
  }
});

export default App;