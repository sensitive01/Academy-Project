import React, { useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const RegisterChild = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [centers, setCenters] = useState([]);
  const [formData, setFormData] = useState({
    center: "",
    // Personal Details
    studentNameEnglish: "",
    studentNameMotherTongue: "",
    dob: "",
    age: "",
    fatherName: "",
    gender: "",
    nationality: "",
    aadharNo: "",
    kcetRegNo: "",
    neetRegNo: "",
    apaarId: "",
    debId: "",
    abcId: "",
    religion: "",
    community: "",
    maritalStatus: "",
    village: "",
    post: "",
    taluk: "",
    district: "",
    pin: "",
    whatsapp: "",
    email: "",
    englishFluency: "",
    language1: "",
    language2: "",
    language3: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankNameBranch: "",

    // Educational Background
    sslcRegNo: "",
    sslcYear: "",
    sslcSchool: "",
    sslcPlace: "",
    sslcBoard: "",
    sslcTotal: "",
    sslcMarks: "",
    sslcPercentage: "",

    hscRegNo: "",
    hscYear: "",
    hscSchool: "",
    hscPlace: "",
    hscBoard: "",
    hscTotal: "",
    hscMarks: "",
    hscPercentage: "",
  });

  React.useEffect(() => {
    const fetchCenters = async () => {
      try {
        const res = await api.get("/centers");
        setCenters(res.data);
      } catch (err) {
        console.error("Failed to fetch centers:", err);
      }
    };
    fetchCenters();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? value : value,
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
    if (loading) return; // prevent double submission

  if (!formData.email || formData.email.trim() === "") {
    toast.error("Email is required");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    toast.error("Enter valid email address");
    return;
  }

  setLoading(true);

  try {

    // -------------------------
    // EDUCATION BACKGROUND
    // -------------------------
    const educationBackground = [1,2,3].map(i => ({
      examinationPassed: formData[`exam${i}`],
      instituteName: formData[`school${i}`],
      group: formData[`group${i}`],
      yearOfPassing: formData[`year${i}`],
      marksPercentage: formData[`percentage${i}`],
      remarks: formData[`remarks${i}`],
    }));


    // -------------------------
    // SSLC SUBJECTS
    // -------------------------
    const sslcSubjects = [1,2,3,4,5,6].map(i => ({
      subject: formData[`sslcSubject${i}`],
      totalMark: formData[`sslcTotal${i}`],
      securedMark: formData[`sslcMark${i}`],
    }));


    const sslcDetails = {
      registerNo: formData.sslcRegNo,
      yearOfPassing: formData.sslcYear,
      schoolName: formData.sslcSchool,
      placeOfSchool: formData.sslcPlace,
      boardOfExamination: formData.sslcBoard,
    };


    // -------------------------
    // HSC SUBJECTS
    // -------------------------
    const hscSubjects = [1,2,3,4,5,6,7].map(i => ({
      subject: formData[`hscSubject${i}`],
      totalMark: formData[`hscTotal${i}`],
      securedMark: formData[`hscMark${i}`],
    }));


    const hscDetails = {
      registerNo: formData.hscRegNo,
      yearOfPassing: formData.hscYear,
      schoolName: formData.hscSchool,
      placeOfSchool: formData.hscPlace,
      boardOfExamination: formData.hscBoard,
    };


    // -------------------------
    // FAMILY BACKGROUND
    // -------------------------
    const relations = ["Father","Mother","Brother / Sister","Brother / Sister","Brother / Sister"];

    const familyBackground = relations.map((rel,i) => ({
      relationship: rel,
      name: formData[`familyName${i}`],
      occupation: formData[`familyOccupation${i}`],
      phone: formData[`familyPhone${i}`],
    }));


    // -------------------------
    // REFERENCES
    // -------------------------
    const references = [1,2,3,4,5].map(i => ({
      name: formData[`refName${i}`],
      mobile: formData[`refMobile${i}`],
    }));


    // FINAL DATA
    const payload = {
      ...formData,
      educationBackground,
      sslcSubjects,
      sslcDetails,
      hscSubjects,
      hscDetails,
      familyBackground,
      references,
    };


    await api.post("/parent/register-child", payload);

    toast.success("Child Registered Successfully");
    navigate("/dashboard/parent-dashboard");

  } catch (err) {
    console.error("Registration error:", err.response?.data || err.message);
    toast.error(err.response?.data?.message || "Registration Failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Student Registration Form</h1>

      <form 
        onSubmit={handleSubmit}
        autoComplete="off"
        className="space-y-8 bg-white p-8 rounded-xl shadow"
      >
        {step === 1 && (
        <>
        {/* PERSONAL DETAILS */}
        <div>
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">
            1. Personal Details
          </h2>

          <div className="grid md:grid-cols-2 gap-6">

            <Input label="Name of Student (English)" name="studentNameEnglish" value={formData.studentNameEnglish} onChange={handleChange} />
            <Input label="Name of Student (Mother Tongue)" name="studentNameMotherTongue" value={formData.studentNameMotherTongue} onChange={handleChange} />

            <Input label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} />
            <Input autoComplete="off" label="Age" name="age" value={formData.age} onChange={handleChange} />

            <Input label="Father / Mother Name" name="fatherName" value={formData.fatherName} onChange={handleChange} />

            <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange}
              options={["Male", "Female", "Other"]} />

            <Input label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
            <Input label="Aadhar No" name="aadharNo" value={formData.aadharNo} onChange={handleChange} />

            <Input label="KCET Reg No" name="kcetRegNo" value={formData.kcetRegNo} onChange={handleChange} />
            <Input label="NEET Reg No" name="neetRegNo" value={formData.neetRegNo} onChange={handleChange} />
            <Input label="APAAR ID Reg No" name="apaarId" value={formData.apaarId} onChange={handleChange} />
            <Input label="DEB Unique ID No" name="debId" value={formData.debId} onChange={handleChange} />
            <Input label="ABC ID No" name="abcId" value={formData.abcId} onChange={handleChange} />

            <Select label="Religion" name="religion" value={formData.religion} onChange={handleChange}
              options={["Hindu", "Muslim", "Christian", "Others"]} />

            <Select label="Community" name="community" value={formData.community} onChange={handleChange}
              options={["MBC", "OC", "OBC", "BC", "SC", "ST", "Others"]} />

            <Select label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange}
              options={["Married", "Unmarried"]} />

            <Select
              label="Select Center"
              name="center"
              value={formData.center}
              onChange={handleChange}
              options={centers.map(c => ({ value: c._id, label: `${c.name} - ${c.location}` }))}
              isObjectOptions
            />

          </div>
        </div>

        {/* ADDRESS */}
        <div>
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">
            Address for Correspondence
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Input label="Village" name="village" value={formData.village} onChange={handleChange} />
            <Input label="Post" name="post" value={formData.post} onChange={handleChange} />
            <Input label="Taluk" name="taluk" value={formData.taluk} onChange={handleChange} />
            <Input label="District" name="district" value={formData.district} onChange={handleChange} />
            <Input label="PIN Code" name="pin" value={formData.pin} onChange={handleChange} />
            <Input label="Whatsapp Number" name="whatsapp" value={formData.whatsapp} onChange={handleChange} />
            <Input autoComplete="off" label="Email Address" name="email" value={formData.email} onChange={handleChange} />
          </div>
        </div>

        {/* LANGUAGE */}
        <div>
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">
            Language Details
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Select label="Fluency in English" name="englishFluency" value={formData.englishFluency}
              onChange={handleChange}
              options={["Excellent", "Average", "Below Average"]} />

            <Input label="Language 1" name="language1" value={formData.language1} onChange={handleChange} />
            <Input label="Language 2" name="language2" value={formData.language2} onChange={handleChange} />
            <Input label="Language 3" name="language3" value={formData.language3} onChange={handleChange} />
          </div>
        </div>

        {/* BANK DETAILS */}
        <div>
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">
            Bank Account Details
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Input label="Account Holder Name" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} />
            <Input label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
            <Input label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleChange} />
            <Input label="Bank Name & Branch" name="bankNameBranch" value={formData.bankNameBranch} onChange={handleChange} />
          </div>
        </div>
        </>
    )}

        {step === 2 && (
        <div>
        <h2 className="text-lg font-semibold border-b pb-2 mb-6">
        II. EDUCATIONAL BACKGROUND
        </h2>

        {/* EDUCATIONAL BACKGROUND TABLE */}
        <div className="overflow-x-auto mb-8">
        <table className="w-full border border-gray-400 text-sm">
        <thead className="bg-gray-100">
        <tr>
        <th className="border p-2">Examination Passed</th>
        <th className="border p-2">Name of Institute / School</th>
        <th className="border p-2">Group</th>
        <th className="border p-2">Year of Passing</th>
        <th className="border p-2">Marks Percentage</th>
        <th className="border p-2">Remarks</th>
        </tr>
        </thead>

        <tbody>
        {[1,2,3].map((i)=>(
        <tr key={i}>
        <td className="border p-2">
        <input autoComplete="off" name={`exam${i}`} value={formData[`exam${i}`] || ""} onChange={handleChange} className="w-full outline-none"/>        </td>
        <td className="border p-2">
        <input autoComplete="off" name={`school${i}`} value={formData[`school${i}`] || ""}  onChange={handleChange} className="w-full outline-none"/>
        </td>
        <td className="border p-2">
        <input autoComplete="off" name={`group${i}`} value={formData[`group${i}`] || ""} onChange={handleChange} className="w-full outline-none"/>
        </td>
        <td className="border p-2">
        <input autoComplete="off" name={`year${i}`} value={formData[`year${i}`] || ""} onChange={handleChange} className="w-full outline-none"/>
        </td>
        <td className="border p-2">
        <input autoComplete="off" name={`percentage${i}`} value={formData[`percentage${i}`] || ""} onChange={handleChange} className="w-full outline-none"/>
        </td>
        <td className="border p-2">
        <input autoComplete="off" name={`remarks${i}`} value={formData[`remarks${i}`] || ""} onChange={handleChange} className="w-full outline-none"/>
        </td>
        </tr>
        ))}
        </tbody>
        </table>
        </div>

        {/* SSLC SECTION */}
        <h3 className="font-semibold mb-3">Student SSLC Details</h3>
        
        {/* SSLC TEXTBOXES ABOVE TABLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <Input autoComplete="off" label="Registered No" name="sslcRegNo" value={formData.sslcRegNo} onChange={handleChange} />
          <Input autoComplete="off" label="Year of Passing" name="sslcYear" value={formData.sslcYear} onChange={handleChange} />
          <Input autoComplete="off" label="School Name" name="sslcSchool" value={formData.sslcSchool} onChange={handleChange} />
          <Input autoComplete="off" label="Place of School" name="sslcPlace" value={formData.sslcPlace} onChange={handleChange} />
          <Input autoComplete="off" label="Board of Examination" name="sslcBoard" value={formData.sslcBoard} onChange={handleChange} />
        </div>

        {/* SSLC SUBJECT TABLE */}
        <div className="mb-6 overflow-x-auto">
          <table className="border border-gray-400 text-sm w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">S.No</th>
                <th className="border p-2">Subject</th>
                <th className="border p-2">Total Mark</th>
                <th className="border p-2">Secured Mark</th>
              </tr>
            </thead>

            <tbody>
              {[1,2,3,4,5,6].map((i)=>(
                <tr key={i}>
                  <td className="border p-2 text-center">{i}</td>
                  <td className="border p-2">
                    <input autoComplete="off" name={`sslcSubject${i}`} value={formData[`sslcSubject${i}`] || ""} onChange={handleChange} className="w-full outline-none"/>
                  </td>
                  <td className="border p-2">
                    <input autoComplete="off" name={`sslcTotal${i}`} value={formData[`sslcTotal${i}`] || ""} onChange={handleChange} className="w-full outline-none text-center"/>
                  </td>
                  <td className="border p-2">
                    <input autoComplete="off" name={`sslcMark${i}`} value={formData[`sslcMark${i}`] || ""} onChange={handleChange} className="w-full outline-none text-center"/>
                  </td>
                </tr>
              ))}

              <tr>
                <td colSpan="2" className="border p-2 font-semibold text-right">Total</td>
                <td className="border p-2">
                  <input autoComplete="off" name="sslcTotalMarks" value={formData.sslcTotalMarks || ""} onChange={handleChange} className="w-full outline-none text-center"/>
                </td>
                <td className="border p-2">
                  <input autoComplete="off" name="sslcSecuredMarks" value={formData.sslcSecuredMarks || ""} onChange={handleChange} className="w-full outline-none text-center"/>
                </td>
              </tr>

              <tr>
                <td colSpan="2" className="border p-2 font-semibold text-right">
                  Percentage / Class
                </td>
                <td colSpan="2" className="border p-2">
                  <input autoComplete="off" name="sslcPercentage" value={formData.sslcPercentage || ""} onChange={handleChange} className="w-full outline-none text-center" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* HSC SECTION */}
        <h3 className="font-semibold mb-3">Student HSC / PU Details</h3>

        {/* HSC TEXTBOXES ABOVE TABLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <Input label="Registered No" name="hscRegNo" value={formData.hscRegNo} onChange={handleChange} />
          <Input label="Year of Passing" name="hscYear" value={formData.hscYear} onChange={handleChange} />
          <Input label="School Name" name="hscSchool" value={formData.hscSchool} onChange={handleChange} />
          <Input label="Place of School" name="hscPlace" value={formData.hscPlace} onChange={handleChange} />
          <Input label="Board of Examination" name="hscBoard" value={formData.hscBoard} onChange={handleChange} />
        </div>

        {/* HSC SUBJECT TABLE */}
        <div className="mb-6 overflow-x-auto">
          <table className="border border-gray-400 text-sm w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">S.No</th>
                <th className="border p-2">Subject</th>
                <th className="border p-2">Total Mark</th>
                <th className="border p-2">Secured Mark</th>
              </tr>
            </thead>

            <tbody>
              {[1,2,3,4,5,6,7].map((i)=>(
                <tr key={i}>
                  <td className="border p-2 text-center">{i}</td>
                  <td className="border p-2">
                    <input autoComplete="off" name={`hscSubject${i}`} value={formData[`hscSubject${i}`] || ""} onChange={handleChange} className="w-full outline-none"/>
                  </td>
                  <td className="border p-2">
                    <input autoComplete="off" name={`hscTotal${i}`} value={formData[`hscTotal${i}`] || ""} onChange={handleChange} className="w-full outline-none text-center"/>
                  </td>
                  <td className="border p-2">
                    <input autoComplete="off" name={`hscMark${i}`} value={formData[`hscMark${i}`] || ""} onChange={handleChange} className="w-full outline-none text-center"/>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="2" className="border p-2 font-semibold text-right">Total</td>
                <td className="border p-2">
                  <input autoComplete="off" name="hscTotalMarks" value={formData.hscTotalMarks || ""} onChange={handleChange} className="w-full outline-none text-center"/>
                </td>
                <td className="border p-2">
                  <input autoComplete="off"
                    name="hscSecuredMarks"
                    value={formData.hscSecuredMarks || ""} onChange={handleChange}
                    className="w-full outline-none text-center"
                  />
                </td>
              </tr>

              <tr>
                <td colSpan="2" className="border p-2 font-semibold text-right">
                  Percentage / Class
                </td>
                <td colSpan="2" className="border p-2">
                  <input autoComplete="off"
                    name="hscPercentage"
                    value={formData.hscPercentage || ""} 
                    onChange={handleChange}
                    className="w-full outline-none text-center"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )}

        {step === 3 && (
<div>
<h2 className="text-lg font-semibold border-b pb-2 mb-6">
III. FAMILY BACKGROUND
</h2>

<div className="overflow-x-auto">
<table className="w-full border border-gray-400 text-sm">
<thead className="bg-gray-100">
<tr>
<th className="border p-2">Relationship</th>
<th className="border p-2">Name</th>
<th className="border p-2">Occupation & Designation</th>
<th className="border p-2">Contact Phone Number</th>
</tr>
</thead>

<tbody>
{["Father","Mother","Brother / Sister","Brother / Sister","Brother / Sister"].map((rel,i)=>(
<tr key={i}>

<td className="border p-2 font-medium">{rel}</td>

<td className="border p-2">
<input
name={`familyName${i}`}
onChange={handleChange}
value={formData[`familyName${i}`] || ""}
className="w-full outline-none"
/>
</td>

<td className="border p-2">
<input
name={`familyOccupation${i}`}
onChange={handleChange}
value={formData[`familyOccupation${i}`] || ""}
className="w-full outline-none"
/>
</td>

<td className="border p-2">
<input
name={`familyPhone${i}`}
onChange={handleChange}
value={formData[`familyPhone${i}`] || ""}
className="w-full outline-none"
/>
</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
)}

{step === 4 && (
<div>
<h2 className="text-lg font-semibold border-b pb-2 mb-6">
VI. REFERENCE CLASS MATE 5 BEST FRIENDS NAME & MOBILE NUMBER
</h2>

<div className="grid grid-cols-3 gap-6">
{[1,2,3,4,5].map((i)=>(

<div key={i} className="border p-4 rounded-lg bg-gray-50">

<div className="mb-3">
<label className="text-sm font-medium">Name</label>
<input
name={`refName${i}`}
onChange={handleChange}
value={formData[`refName${i}`] || ""}
className="w-full border p-2 rounded"
/>
</div>

<div>
<label className="text-sm font-medium">Mobile Number</label>
<input
name={`refMobile${i}`}
onChange={handleChange}
value={formData[`refMobile${i}`] || ""}
className="w-full border p-2 rounded"
/>
</div>
</div>
))}
</div>
</div>
)}

<div className="flex justify-end gap-4">
  {/* BACK BUTTON */}
  {step > 1 && (
    <button
      type="button"
      onClick={() => setStep(step - 1)}
      className="px-6 py-2 border rounded-lg"
    >
      Back
    </button>
  )}

  {/* NEXT BUTTON */}
  {step < 4 && (
    <button
      type="button"
      onClick={() => setStep(step + 1)}
      className="bg-blue-600 text-white px-6 py-2 rounded-lg"
    >
      Next
    </button>
  )}

  {/* SUBMIT BUTTON */}
  {step === 4 && (
    <button
      type="submit"
      disabled={loading}
      className="bg-blue-600 text-white px-6 py-2 rounded-lg"
    >
      {loading ? "Submitting..." : "Submit"}
    </button>
  )}
</div>
      </form>
    </div>
  );
};

// Reusable Components
const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      autoComplete="new-password"
      {...props}
      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const Select = ({ label, options, isObjectOptions, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <select autoComplete="off" {...props} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
      <option value="">Select</option>
      {options.map((opt, i) => (
        <option key={i} value={isObjectOptions ? opt.value : opt}>
          {isObjectOptions ? opt.label : opt}
        </option>
      ))}
    </select>
  </div>
);

export default RegisterChild;